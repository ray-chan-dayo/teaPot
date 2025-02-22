import { brackets } from "./libs/brackets"
import { Expect } from "./libs/expect.d"
import * as leaf from "./leaves"

export function parseArgs( input: string ): Expect<Array<leaf.Prototype>> {
    
    const ripped = input.split('"')
    if (ripped.length % 2 !== 1)
        return Expect.error("invalid_quote")

    const unparsed:Array<leaf.Prototype> = []
    for (let i = 0; i < ripped.length; i++) {
        console.log(ripped[i])
        if (i%2 === 1)
            unparsed.push(new leaf.StringLiteral(ripped[i]))
        else {
            ripped[i].match(/\w+|\W/g)?.forEach(e=>unparsed.push(new leaf.Unparsed(e)))
        }
    }

    // bracket parser
    let isPotentiallyFunction: boolean = false
    ,   isPotentiallyArray: boolean = false
    ,   isObjectExpected: boolean = true
    let currentBrackets:Array<{
        bracketType: ")" | "]" | "}",
        parent: Array<leaf.Prototype>
    }> = []
    const bracketsParsed:Array<leaf.Prototype> = []
    let parent:Array<leaf.Prototype> = bracketsParsed
    for (let i = 0; i < unparsed.length; i++) {
        const currentLeaf = unparsed[i]
        if (leaf.isString(currentLeaf))
            if (isObjectExpected) {
                isObjectExpected = false
                isPotentiallyFunction = false
                isPotentiallyArray = false
                parent.push(new leaf.StringLiteral(currentLeaf.value))
            } else
                return Expect.error("comma_expected")
        else {
            if ( !leaf.isUnparsed(currentLeaf)) {
                console.error(`during parsing brackets, parsed leaf found: ${currentLeaf}`)
                return Expect.error("internal_error")
            }
            if (/\W/.test(currentLeaf.value)) {
                switch (currentLeaf.value) {
                    case ",":
                    case ";":
                    case "+":
                    case "-":
                    case "*":
                    case "/":
                    case "%":
                    case ">":
                    case "<":
                    case "=":
                    case ".":
                        isObjectExpected = true
                        isPotentiallyArray = false
                        isPotentiallyFunction = false
                        parent.push(new leaf.Unparsed(currentLeaf.value))
                        break
                    case " ":{
                        isPotentiallyArray = false
                    }break
                    case "$":
                    case "@":
                        const prev = parent.pop()
                        if (leaf.isUnparsed(prev) && /\w+/.test(prev.value))
                            parent.push(new leaf.Unparsed(prev.value + currentLeaf.value))
                        break
                    case "(":{
                        let currentParent: Array<leaf.Prototype>
                        if (isPotentiallyFunction) {
                            // function化の処理
                            // 下の配列添え字の処理と統合した方がスマートかな？後でやってみたい。
                            const prev = parent.pop()
                            if (leaf.isUnparsed(prev)) {
                                const funcName = prev.value
                                parent.push(new leaf.Func(funcName))
                                // 今pushしたばかりのleafを取得
                                currentParent = (parent[parent.length-1] as leaf.Func).args
                            } else {
                                console.error(`isPotentiallyFunction is true but prev was not unparsed. Got: ${prev}`)
                                return Expect.error("internal_error")
                            }
                        } else
                            if (isObjectExpected) {
                                // 丸括弧の処理
                                parent.push(new leaf.RoundBracket())
                                currentParent = (parent[parent.length-1] as leaf.RoundBracket).children
                            } else
                                return Expect.error("unexpected_(")
                        // 閉じ括弧の処理
                        currentBrackets.push({
                            bracketType: ")",
                            parent: currentParent
                        })
                        parent = currentParent

                        isObjectExpected = true
                        isPotentiallyArray = false
                        isPotentiallyFunction = false
                    }break

                    case "[":{
                        let currentParent: Array<leaf.Prototype>
                        if (isPotentiallyArray) {
                            // 添え字の処理 (functionのを流用)
                            const prev = parent.pop()
                            if (leaf.isUnparsed(prev)) {
                                const arrayName = prev.value
                                parent.push(new leaf.ArrayElement(arrayName))
                                // 今pushしたばかりのleafを取得
                                currentParent = (parent[parent.length-1] as leaf.ArrayElement).index
                            } else {
                                console.error(`isPotentiallyArray is true but prev was not unparsed. Got: ${prev}`)
                                return Expect.error("internal_error")
                            }
                        } else 
                            if (isObjectExpected) {
                                // 配列の生成
                                parent.push(new leaf.ArrayLiteral())
                                currentParent = (parent[parent.length-1] as leaf.ArrayLiteral).elements
                            } else
                                return Expect.error("unexpected_[")
                        // 閉じ括弧の処理
                        currentBrackets.push({
                            bracketType: "]",
                            parent: currentParent
                        })
                        parent = currentParent

                        isObjectExpected = true
                        isPotentiallyArray = true
                        isPotentiallyFunction = false
                    }break
                    case ")":
                    case "]":{
                        // 閉じ括弧の処理
                        if ( currentLeaf.value === currentBrackets[0].bracketType ) {
                            currentBrackets.pop()
                            if (currentBrackets[0])
                                parent = currentBrackets[currentBrackets.length - 1].parent
                            else
                                parent = bracketsParsed
                            // push to result
                        } else
                            return Expect.error("unexpected_bracket_close")
                    }break
                    default:
                        console.error(`unexpected Special Letter: ${currentLeaf.value}`)
                        return Expect.error("unexpected_letter")
                        break
                }
            } else { // alphanumeric
                // 数字処理
                if (/\d/.test(currentLeaf.value[0])) {
                    if (/\d+/.test(currentLeaf.value)) {
                        parent.push(new leaf.NumberLiteral(parseInt(currentLeaf.value)))
                    } else
                        return Expect.error("number_imparsable")
                } else
                    if (isObjectExpected) {
                        isObjectExpected = false
                        isPotentiallyFunction = true
                        isPotentiallyArray = true
                        parent.push(new leaf.Unparsed(currentLeaf.value))
                    } else
                        return Expect.error("comma_expected")
            }
        }
    }

    //
    return Expect.result(bracketsParsed)
}
