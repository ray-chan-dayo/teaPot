import * as leaf from "./leaves"
import { Expect } from "./libs/expect"
import { betterThanRecursive } from "./betterThanRecursive"
import { parseBrackets } from "./parseBrackets"
import { parseOperators } from "./parseOperators"

export function parseArgs( input: string, /*typeArray: Array<leaf.potType>*/ ): Expect<Array<leaf.Prototype>> {

    const ripped = input.split('"')
    if (ripped.length % 2 !== 1)
        return Expect.error("invalid_quote")

    const unparsed:Array<leaf.Prototype> = []
    for (let i = 0; i < ripped.length; i++) {
        if (i%2 === 1)
            unparsed.push(new leaf.StringLiteral(ripped[i]))
        else {
            ripped[i].match(/\w+|[<>=]+|./g)?.forEach(e=>unparsed.push(new leaf.Unparsed(e.toLowerCase())))
        }
    }

    const bracketResult = parseBrackets(unparsed)
    if (!bracketResult.success)
        return bracketResult
    const parseTarget = bracketResult.value
    const isArithmeticallyValid = (a: Array<leaf.Prototype>)=>leaf.mightBeNumber(a[0]) && leaf.mightBeNumber(a[1])
    const isValid = (a: Array<leaf.Prototype>)=>leaf.mightBeNumber(a[0]) && leaf.mightBeNumber(a[1]) || leaf.mightBeString(a[0]) && leaf.mightBeString(a[1])
    const parseResults = [
        parseDecimals(parseTarget),
        parseMinus(parseTarget),
        parseOperators(parseTarget, ["*","/"], [isArithmeticallyValid, isArithmeticallyValid]),
        parseOperators(parseTarget, ["%"], [isArithmeticallyValid]),
        parseOperators(parseTarget, ["+","-"], [isValid, isArithmeticallyValid]),
        Expect.result(console.log(`README: ${JSON.stringify(parseTarget)}`)),
        parseOperators(parseTarget, ["=","<>",">","<",">=","<="], [isValid, isValid, isArithmeticallyValid, isArithmeticallyValid, isArithmeticallyValid, isArithmeticallyValid])
    ]
    // エラー処理
    for (let i = 0; i < parseResults.length; i++) {
        const e = parseResults[i]
        if ( Expect.isError(e) ) return e
    }
    
    return Expect.result(parseTarget)

    let isObjectExpected: boolean = true

    // カンマ処理
}

function parseDecimals(bracketsParsed: Array<leaf.Prototype>):Expect<void> {
    //wrap function
    function callbackfn(target:Array<leaf.Prototype>) {
        // 小数点の処理
        for (let i = 0; i < target.length; i++) {
            if (leaf.isUnparsed(target[i]) && (target[i] as leaf.Unparsed).value === ".") {
                if ( !(0<i &&i<target.length-1) )
                    return Expect.error("unexpected_.")
                const int = target[i-1]
                const decimal = target[i+1]
                if (!(
                    leaf.isNumber(int) &&
                    Number.isInteger(int.value) &&
                    leaf.isNumber(decimal) &&
                    Number.isInteger(int.value)
                ))
                    return Expect.error("unexpected_.")
                    target.splice(i-1,3,
                        new leaf.NumberLiteral(Number(`${int}.${decimal}`))
                    )
                i--
                continue
            }
        }
    }
    return betterThanRecursive(bracketsParsed, callbackfn)
}

function parseMinus(target: Array<leaf.Prototype>):Expect<void> {
    // wrap function
    function callbackfn(target: Array<leaf.Prototype>) {
        // 2項演算子の処理を流用した。もし統合できそうならしたいなぁ
        for (let i = 0; i < target.length; i++) {
            // -のパース
            if ( leaf.isUnparsed(target[i]) && (target[i] as leaf.Unparsed).value === "-" ) {
                if (!( i<target.length-1 && leaf.mightBeNumber(target[i+1]) ))
                    // return Expect.error("invalid_-")
                    // 例えば--1みたいな、二重にオペレータが入ってきた場合、左からパースするこのパーサーはエラーを吐く。エラーをsurpressし、二項演算にその処理を丸投げすることにより解決する。
                    // 最後のi-=2もこれの一部。
                    continue
                if (( 0<i && leaf.mightBeNumber(target[i-1]) ))
                    continue
                // マイナス化処理
                if (leaf.isNumber(target[i+1]))
                    target.splice(i,2,
                        new leaf.NumberLiteral((target[i-1] as leaf.NumberLiteral).value * -1)
                    )
                else
                    target.splice(i,2,
                        new leaf.binaryOperation("*", new leaf.NumberLiteral(-1), target[i-1])
                    )
                i-=2
            }
        }
    }
    return betterThanRecursive(target, callbackfn)
}

function parseNot(target: Array<leaf.Prototype>):Expect<void> {
    // wrap function
    function callbackfn(target: Array<leaf.Prototype>) {
        // -の処理を流用した。もし統合できそうならしたいなぁ
        for (let i = 0; i < target.length; i++) {
            if ( leaf.isUnparsedLogical(target[i]) && (target[i] as leaf.UnparsedLogial).operation === "not" ) {
                if (!( i<target.length-1 && leaf.mightBeNumber(target[i+1]) ))
                    continue
                target.splice(i,2,
                    new leaf.BitNot(target[i+1]))
                i-=2
            }
        }
    }
    betterThanRecursive(target, callbackfn)
    return betterThanRecursive(target,
        (target: Array<leaf.Prototype>)=>
            target.some(l=>leaf.isUnparsedLogical(l)&&l.operation==="not")?
                Expect.error("invalid_not")
                :Expect.result(undefined)
    )
}
