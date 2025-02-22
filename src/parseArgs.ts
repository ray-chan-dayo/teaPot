import { brackets } from "./libs/brackets"
import { Expect } from "./libs/expect"
import * as leaf from "./leaves"

export function parseArgs( input: string ): Expect<Array<leaf.Prototype>> {
    
    const ripped = input.split('"')
    if (ripped.length % 2 !== 1)
        return Expect.error("invalid_quote")

    const unparsed:Array<leaf.Prototype> = []
    for (let i = 0; i < ripped.length; i++) {
        if (i%2 === 1)
            unparsed.push(new leaf.StringLiteral(ripped[i]))
        else {
            ripped[i].match(/\w+|\W/)?.forEach(e=>unparsed.push(new leaf.Unparsed(e)))
        }
    }
{
    let isPotentiallyFunction: boolean = false
    ,   isPotentiallyArray: boolean = false
    ,   isObjectExpected: boolean = true
    let currentBrackets:Array<{
        bracketType: ")" | "]" | "}",
        parent: Array<leaf.Prototype>
    }> = []
    const result:Array<leaf.Prototype> = []
    let parent:Array<leaf.Prototype> = result

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
        else
            if ( leaf.isUnparsed(currentLeaf)) {
                if (/\W/.test(currentLeaf.value)) {
                    switch (currentLeaf.value) {
                        case ",":
                        case ";":
                            isObjectExpected = true
                            isPotentiallyArray = false
                            isPotentiallyFunction = false
                            break
                        case " ":
                            isPotentiallyArray = false
                            break
                        case "(":
                            let currentParent: Array<leaf.Prototype>
                            if (isPotentiallyFunction) {
                                // function化の処理
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
                            break
                        case "[":
                            if (isPotentiallyArray) {
                                // 添え字の処理
                            }
                            break
                        case ")":
                        case "]":
                            // bracket closer
                            if ( currentLeaf.value === currentBrackets[0].bracketType ) {
                                currentBrackets.shift()
                                parent = currentBrackets[currentBrackets.length - 1].parent
                            }
                            else
                                return Expect.error("unexpected_bracket_close")
                            break
                        default:
                            return Expect.error("unexpected_letter")
                            break
                    }
                }
            } else { //alphanumeric
                // 数字処理、後でやる
                if (isObjectExpected) {
                    isObjectExpected = false
                    isPotentiallyFunction = true
                    isPotentiallyArray = true
                } else
                    return Expect.error("comma_expected")
            }
    }
}}
