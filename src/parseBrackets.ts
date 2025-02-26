import * as leaf from "./leaves"
import { Expect } from "./libs/expect"
import { relationalOperators } from "./libs/miscs"

export function parseBrackets(unparsed: Array<leaf.Prototype>): Expect<Array<leaf.Prototype>> {

    // bracket parser
    let isPotentiallyFunction: boolean = false
    ,   isPotentiallyArray: boolean = false
    let currentBrackets:Array<{
        bracketType: ")" | "]" | "}",
        parent: Array<leaf.Prototype>
    }> = []
    const bracketsParsed:Array<leaf.Prototype> = []
    let parent:Array<leaf.Prototype> = bracketsParsed
    for (let i = 0; i < unparsed.length; i++) {
        const currentLeaf = unparsed[i]
        
        if (leaf.isString(currentLeaf)) {
            isPotentiallyFunction = false
            isPotentiallyArray = false
            parent.push(new leaf.StringLiteral(currentLeaf.value))
            continue
        }

        if ( !leaf.isUnparsed(currentLeaf)) {
            console.error(`during parsing brackets, parsed leaf found: ${currentLeaf}`)
            return Expect.error("internal_error")
        }
        
        if (!/\W/.test(currentLeaf.value)) // alphanumeric
            if (/\d/.test(currentLeaf.value[0])) {
                // 数字処理
                if (!/\d+/.test(currentLeaf.value))
                    return Expect.error("number_imparsable")
                isPotentiallyFunction = false
                isPotentiallyArray = false
                parent.push(new leaf.NumberLiteral(parseInt(currentLeaf.value)))
            } else if (leaf.isLogicalOperator(currentLeaf.value)) {
                // 論理
                isPotentiallyFunction = false
                isPotentiallyArray = false
                parent.push(new leaf.UnparsedLogial(currentLeaf.value))
            } else {
                isPotentiallyFunction = true
                isPotentiallyArray = true
                parent.push(new leaf.Unparsed(currentLeaf.value))
            }

        else
            switch (currentLeaf.value[0]) {
                case ">":
                case "<":
                case "=":
                    if (!relationalOperators.includes(currentLeaf.value))
                        return Expect.error("invalid_relational")
                    // 落下
                case ",":
                case ";":
                case "+":
                case "-":
                case "*":
                case "/":
                case "%":
                case ".":
                    isPotentiallyArray = false
                    isPotentiallyFunction = false
                    parent.push(new leaf.Unparsed(currentLeaf.value))
                    break
                case " ":
                    isPotentiallyArray = false
                    break
                case "$":
                case "@":{
                    const prev = parent.pop()
                    if (leaf.isUnparsed(prev) && !/\W/.test(prev.value))
                        parent.push(new leaf.Unparsed(prev.value + currentLeaf.value))
                    else
                        return Expect.error("invalid_$@")
                }break
                case "(":{
                    let currentParent: Array<leaf.Prototype>
                    if (isPotentiallyFunction) {
                        // function化の処理
                        // 下の配列添え字の処理と統合した方がスマートかな？後でやってみたい。
                        const prev = parent.pop()
                        if (!leaf.isUnparsed(prev)) {
                            console.error(`isPotentiallyFunction is true but prev was not unparsed. Got: ${prev}`)
                            return Expect.error("internal_error")
                        }
                        const funcName = prev.value
                        parent.push(new leaf.Func(funcName))
                        // 今pushしたばかりのleafを取得
                        currentParent = (parent[parent.length-1] as leaf.Func).args
                    } else{
                        // 丸括弧の処理
                        parent.push(new leaf.RoundBracket())
                        currentParent = (parent[parent.length-1] as leaf.RoundBracket).children
                    }
                    // 閉じ括弧の処理
                    currentBrackets.push({
                        bracketType: ")",
                        parent: currentParent
                    })
                    parent = currentParent

                    isPotentiallyArray = false
                    isPotentiallyFunction = false
                }break

                case "[":{
                    let currentParent: Array<leaf.Prototype>
                    if (isPotentiallyArray) {
                        // 添え字の処理 (functionのを流用)
                        const prev = parent.pop()
                        if (!leaf.isUnparsed(prev)) {
                            console.error(`isPotentiallyArray is true but prev was not unparsed. Got: ${prev}`)
                            return Expect.error("internal_error")
                        }
                        const arrayName = prev.value
                        parent.push(new leaf.ArrayElement(arrayName))
                        // 今pushしたばかりのleafを取得
                        currentParent = (parent[parent.length-1] as leaf.ArrayElement).index
                    } else {
                        // 配列の生成
                        parent.push(new leaf.ArrayLiteral())
                        currentParent = (parent[parent.length-1] as leaf.ArrayLiteral).elements
                    }
                    // 閉じ括弧の処理
                    currentBrackets.push({
                        bracketType: "]",
                        parent: currentParent
                    })
                    parent = currentParent

                    isPotentiallyArray = true
                    isPotentiallyFunction = false
                }break
                case ")":
                case "]":{
                    // 閉じ括弧の処理
                    if ( currentLeaf.value !== currentBrackets[0].bracketType ) 
                        return Expect.error("unexpected_bracket_close")
                    currentBrackets.pop()
                    if (currentBrackets[0])
                        parent = currentBrackets[currentBrackets.length - 1].parent
                    else
                        parent = bracketsParsed
                }break
                default:
                    // console.error(`unexpected Special Letter: ${currentLeaf.value}`)
                    return Expect.error("unexpected_letter")
            }
    }
    return Expect.result(bracketsParsed)
}
