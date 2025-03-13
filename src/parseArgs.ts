import * as leaf from "./leaves"
import { Expect } from "./libs/expect"
import { relationalOperators } from "./libs/miscs"
import { parseExpression } from "./parseExpression"

export function parseArgs( input: string ): Expect<Array<leaf.Prototype>> {

    const ripped = input.split('"')
    if (ripped.length % 2 !== 1)
        return Expect.error("invalid_quote")

    const unparsed:Array<leaf.Prototype> = []
    for (let i = 0; i < ripped.length; i++) {
        if (i%2 === 1)
            unparsed.push(new leaf.StringLiteral(ripped[i]))
        else {
            ripped[i].match(
                /\d+\.\d+|\w+|[<>=]+|./g
            )?.forEach(e=>unparsed.push(new leaf.Unparsed(e.toLowerCase())))
        }
    }

    const parsed:Array<leaf.Prototype> = []

    const pending: Array<Array<leaf.Prototype>> = [[]]
    let isPrevSpace = true
    // エラー表示をしやすくするためにisExpressionExpectedを作る。
    let isExpressionExpected = true
    for (let i = 0; i < unparsed.length; i++) {
        const current = unparsed[i]
        if (leaf.isString(current)) {
            if (!isExpressionExpected) return Expect.error("expected_comma")
            pending[0].push(current)
            isExpressionExpected = false
            continue
        }
        if (leaf.isUnparsed(current)) {
            
            if (current.value === " ") { isPrevSpace = true; continue }
            isPrevSpace = false
            
            if (/\w/.test(current.value)) {
                // 半角英数の処理
                if (/\d/.test(current.value[0])) {
                    if (!isExpressionExpected) return Expect.error("expected_comma",i)
                    isExpressionExpected = false
                    if (/^\d+\.?\d*$/.test(current.value)) {
                        // 01とかがパースできてしまうので殺す
                        if ( current.value !== "0" && current.value[0] === "0" && current.value[1] !=="." )
                            return Expect.error("inparsable_number")
                        pending[0].push(new leaf.NumberLiteral(parseFloat(current.value)))
                    } else
                        return Expect.error("inparsable_number",i)
                } else if (leaf.isLogicalOperator(current.value)) {
                    pending[0].push(new leaf.UnparsedLogial(current.value))
                    isExpressionExpected = true
                }
                else {
                    if (!isExpressionExpected) return Expect.error("expected_comma",i)
                    isExpressionExpected = false
                    pending[0].push(current)
                }
            }
            if (!/\w/.test(current.value) && current.value !== ",")
                switch (current.value) {
                    case ">":
                    case "<":
                    case "=":
                        if (!relationalOperators.includes(current.value))
                            return Expect.error("invalid_relational_operator",i)
                        // 落下
                    case "+":
                    case "*":
                    case "/":
                    case "%":
                        if (isExpressionExpected) return Expect.error("expected_object",i)
                    case "-":
                        pending[0].push(current)
                        isExpressionExpected = true
                        break
                    case "@":
                    case "$":{
                        const prev = pending[0].pop()
                        if (leaf.isUnparsed(prev) && !/\W/.test(prev.value) && !isPrevSpace)
                            pending[0].push(new leaf.Unparsed(prev.value + current.value))
                        else
                            return Expect.error("invalid_$@",i)
                    }break
                    case "(":{
                        const prev = pending[0][pending[0].length-1]
                        if ( leaf.isUnparsed(prev) && (/\w/.test(prev.value) || prev.value.at(-1)==="$" || prev.value.at(-1)==="@") ) {
                            // function化の処理
                            pending[0].pop()
                            const funcName = prev.value
                            if (prev.value.at(-1)==="@")
                                pending[0].push(new leaf.Func(funcName, "array"))
                            else if (prev.value.at(-1)==="$")
                                pending[0].push(new leaf.Func(funcName, "string"))
                            else
                                pending[0].push(new leaf.Func(funcName, "number"))
                            pending.unshift([])
                        }
                        else {
                            // 丸括弧の処理
                            if (!isExpressionExpected) return Expect.error("expected_comma",i)
                            pending[0].push(new leaf.RoundBracket())
                            pending.unshift([])
                        }
                        isExpressionExpected = true
                    }break

                    case "[":{
                        const prev = pending[0][pending[0].length-1]
                        if ( !isPrevSpace && leaf.mightBeArray(prev) )
                        {
                            pending[0].pop()
                            if (isExpressionExpected) {
                                console.error(`isExpressionExpected is true dispite ArrayElement was about to construct. prev:${JSON.stringify(prev)}`)
                                return Expect.error("internal_error")
                            }
                            if (leaf.isUnparsed(prev))
                                pending[0].push(new leaf.UnparsedArrayElement(new leaf.Variable(prev.value, "array")))
                            else
                                pending[0].push(new leaf.UnparsedArrayElement(prev))
                            pending.unshift([])
                        } else {
                            // 配列の生成
                            if (!isExpressionExpected)
                                // 細かくエラーを返してあげるの
                                if (isPrevSpace)
                                    return Expect.error("expected_comma",i)
                                else
                                    return Expect.error("index_non_array",i)
                            pending[0].push(new leaf.ArrayLiteral())
                            pending.unshift([])
                        }

                        isExpressionExpected = true
                    }break
                    case "]":{
                        // 閉じ括弧の処理
                        if (!pending[1])
                            // 階層化されていなければerr
                            return Expect.error("unexpected_]",i)
                        // at(-1)だとpossibly undefinedされた。
                        const parent = pending[1][pending[1].length-1]
                        const children = pending.shift()
                        if (leaf.isArrayLiteral(parent)) {
                            // 配列
                            if (children) {
                                const elem = parseExpression(children)
                                if (!elem.success)
                                    return elem // TODO: 後で行数指定ちゃんとする
                                parent.elements.push(elem.value)
                            }
                        } else if (leaf.isUnparsedArrayElement(parent)) {
                            // 配列の要素
                            if (!children)
                                return Expect.error("empty_index",i)
                            const index = parseExpression(children)
                            if (!index.success)
                                return index // TODO: 後で行数指定ちゃんとする
                            pending[0][pending[0].length-1] = new leaf.ArrayElement(parent, index.value)
                        } else
                            return Expect.error("unexpected_]",i)
                        isExpressionExpected = false
                    }break
                    case ")":{
                        // 閉じ括弧の処理
                        if (!pending[1])
                            // 階層化されていなければerr
                            return Expect.error("unexpected_)",i)
                        // at(-1)だとpossibly undefinedされた。
                        const parent = pending[1][pending[1].length-1]
                        const args = pending.shift()
                        
                        if (leaf.isFunc(parent)) {
                            // 関数
                            // 最後の引数をパースする
                            if (args) {
                                const elem = parseExpression(args)
                                if (!elem.success)
                                    return elem // TODO: 後で行数指定ちゃんとする
                                parent.args.push(elem.value)
                            } else if (parent.args[0])
                                // もしmyFunc(1,)みたいにカンマで終わっていたら殺す。
                                return Expect.error("extra_comma",i)
                        } else if (leaf.isRoundBracket(parent)) {
                            // ただの丸括弧
                            // 最後の要素をパースする
                            if (!args)
                                return Expect.error("unexpected_)",i)
                            const elem = parseExpression(args)
                            if (!elem.success)
                                return elem // TODO: 後で行数指定ちゃんとする
                            parent.children.push(elem.value)
                        } else
                            // 丸括弧でも関数でもないのに)が入力された
                            return Expect.error("unexpected_)",i)
                        isExpressionExpected = false
                    }break
                    default:
                        console.error(`unexpected Special Letter: ${current.value}`)
                        return Expect.error("unexpected_letter",i)
                }
            if (current.value === ",") {
                // pendingをpushTargetに移動する処理
                // 2項演算子の処理
                if (isExpressionExpected) return Expect.error("expected_object",i)
                isExpressionExpected = true
                if (pending[1]) {
                    const parent = pending[1][pending[1].length-1]
                    const child = parseExpression(pending[0])
                    if (!child.success)
                        return child
                    if (leaf.isFunc(parent))
                        parent.args.push(child.value)
                    else if (leaf.isRoundBracket(parent))
                        parent.children.push(child.value)
                    else if (leaf.isArrayLiteral(parent))
                        parent.elements.push(child.value)
                    else if (leaf.isUnparsedArrayElement(parent))
                        return Expect.error("comma_in_index")
                    else {
                        console.error(`unexpected parent: ${parent}`)
                        return Expect.error("internal_error")
                    }
                    pending[0] = []
                }
                if (pending[0].length > 0) {
                    const res = parseExpression(pending[0])
                    if (!res.success)
                        return res
                    parsed.push(res.value)
                    pending[0] = []
                }
            }
        }
    }
    const res = parseExpression(pending[0])
    if (!res.success)
        return res
    parsed.push(res.value)
    pending[0] = []

    return Expect.result(parsed)
}
