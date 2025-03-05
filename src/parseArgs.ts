import * as leaf from "./leaves"
import { Expect } from "./libs/expect"
import { relationalOperators } from "./libs/miscs"

export function parseArgs( input: string, /*typeArray: Array<leaf.potType>*/ ): Expect<Array<leaf.Prototype>> {

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
    // エラー表示をしやすくするためにisObjectExpectedを作る。
    let isObjectExpected = true
    for (let i = 0; i < unparsed.length; i++) {
        const current = unparsed[i]
        if (leaf.isString(current)) {
            if (!isObjectExpected) return Expect.error("expected_comma")
            pending[0].push(current)
            isObjectExpected = false
            continue
        }
        if (leaf.isUnparsed(current)) {
            
            if (current.value === " ") { isPrevSpace = true; continue }
            isPrevSpace = false
            
            if (/\w/.test(current.value)) {
                // 半角英数の処理
                if (/\d/.test(current.value[0])) {
                    if (!isObjectExpected) return Expect.error("expected_comma",i)
                    isObjectExpected = false
                    if (/^\d+\.?\d*$/.test(current.value)) {
                        // 01とかがパースできてしまうので殺す
                        if ( current.value !== "0" && current.value[0] === "0" && current.value[1] !=="." )
                            return Expect.error("inparsable_number")
                        pending[0].push(new leaf.NumberLiteral(parseFloat(current.value)))
                    } else
                        return Expect.error("inparsable_number",i)
                } else if (leaf.isLogicalOperator(current.value)) {
                    pending[0].push(new leaf.UnparsedLogial(current.value))
                    isObjectExpected = true
                }
                else {
                    if (!isObjectExpected) return Expect.error("expected_comma",i)
                    isObjectExpected = false
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
                        if (isObjectExpected) return Expect.error("expected_object",i)
                    case "-":
                        pending[0].push(current)
                        isObjectExpected = true
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
                            pending[0].push(new leaf.Func(funcName))
                            pending.unshift([])
                        }
                        else {
                            // 丸括弧の処理
                            if (!isObjectExpected) return Expect.error("expected_comma",i)
                            pending[0].push(new leaf.RoundBracket())
                            pending.unshift([])
                        }
                        isObjectExpected = true
                    }break

                    case "[":{
                        const prev = pending[0][pending[0].length-1]
                        if ( !isPrevSpace && leaf.mightBeArray(prev) )
                        {
                            pending[0].pop()
                            if (isObjectExpected) {
                                console.error(`isObjectExpected is true dispite ArrayElement was about to construct. prev:${JSON.stringify(prev)}`)
                                return Expect.error("internal_error")
                            }
                            if (leaf.isUnparsed(prev))
                                pending[0].push(new leaf.ArrayElement(new leaf.Variable(prev.value, "array")))
                            else
                                pending[0].push(new leaf.ArrayElement(prev))
                            pending.unshift([])
                        } else {
                            // 配列の生成
                            if (!isObjectExpected)
                                // 理論上正しいが、直観的にするために追加。
                                if (isPrevSpace)
                                    return Expect.error("expected_comma",i)
                                else
                                    return Expect.error("type_not_array",i)
                            pending[0].push(new leaf.ArrayLiteral())
                            pending.unshift([])
                        }

                        isObjectExpected = true
                    }break
                    case "]":{
                        // 閉じ括弧の処理
                        if (!pending[1])
                            // 階層化されていなければerr
                            return Expect.error("unexpected_]",i)
                        // at(-1)だとpossibly undefinedされた。
                        const parent = pending[1][pending[1].length-1]
                        const children = pending.shift()
                        if (leaf.isArray(parent)) {
                            // 配列
                            if (children) {
                                const elem = parseObject(children)
                                if (!elem.success)
                                    return elem // 後で行数指定ちゃんとする
                                // parent.elements.push(elem.value) // 動くか分からん
                                // ;(pending[0][pending[0].length-1] as leaf.ArrayElement).elements.push(elem.value) // 動かん時の保険
                            }
                        } else if (leaf.isArrayElement(parent)) {
                            // 配列の要素
                            if (!children)
                                return Expect.error("empty_index",i)
                            const index = parseObject(children)
                            if (!index.success)
                                return index // 後で行数指定ちゃんとする
                            parent.index = index.value // 動くか分からん
                            // ;(pending[0][pending[0].length-1] as leaf.ArrayElement).index = index.value // 動かん時の保険
                        } else
                            return Expect.error("unexpected_]",i)
                        isObjectExpected = false
                    }break
                    case ")":{
                        // 閉じ括弧の処理
                        if (!pending[1])
                            // 階層化されていなければerr
                            return Expect.error("unexpected_)",i)
                        const parent = pending[1][pending[1].length-1]
                        const args = pending.shift()
                        
                        // at(-1)だとpossibly undefinedされた。
                        if (leaf.isFunc(parent)) {
                            // 関数
                            // 最後の引数をパースする
                            if (args) {
                                const elem = parseObject(args)
                                if (!elem.success)
                                    return elem // 後で行数指定ちゃんとする
                                parent.args.push(elem.value) // 動くか分からん
                            } else if (parent.args[0])
                                // もしmyFunc(1,)みたいにカンマで終わっていたら殺す。
                                return Expect.error("extra_comma")
                        } else if (leaf.isRoundBracket(parent)) {
                            // TODO: ただの丸括弧
                            // 最後の要素をパースする
                            if (!args)
                                return Expect.error("unexpected_)",i)
                            parseObject(args)
                        } else
                            // 丸括弧でも関数でもないのに)が入力された
                            return Expect.error("unexpected_)",i)
                        isObjectExpected = false
                    }break
                    default:
                        console.error(`unexpected Special Letter: ${current.value}`)
                        return Expect.error("unexpected_letter",i)
                }
            if (current.value === ",") {
                // pendingをpushTargetに移動する処理
                // 2項演算子の処理
                if (pending[1]) {
                    const parent = pending[1][pending[1].length-1]
                    const child = parseObject(pending[0])
                    if (!child.success)
                        return child
                    if (leaf.isFunc(parent))
                        parent.args.push(child.value)
                    if (leaf.isRoundBracket(parent))
                        parent.children.push(child.value)
                    if (leaf.isArray(parent))
                        parent.elements.push(child.value)
                    if (leaf.isArrayElement(parent))
                        return Expect.error("comma_in_index")
                    pending[0] = []
                }
                const res = parseObject(pending[0])
                if (!res.success)
                    return res
                parsed.push(res.value)
                pending[0] = []
            }
        }
    }
    const res = parseObject(pending[0])
    if (!res.success)
        return res
    parsed.push(res.value)
    pending[0] = []
    
    return Expect.result(parsed)
}

const order: Array<Array<{ operator: leaf.binaryOperator, pottype: Array<leaf.potType> }>> = [
    [
        { operator: "*", pottype: ["any","number"] },
        { operator: "/", pottype: ["any","number"] }
    ],[
        { operator: "%", pottype: ["any","number"]}
    ],[
        { operator: "+", pottype: ["any","number", "string", "array"]},
        { operator: "-", pottype: ["any","number"]}
    ],[
        { operator: "=" , pottype: ["any","number", "string", "array"]},
        { operator: "<>", pottype: ["any","number", "string", "array"]},
        { operator: ">" , pottype: ["any","number"]},
        { operator: "<" , pottype: ["any","number"]},
        { operator: ">=", pottype: ["any","number"]},
        { operator: "<=", pottype: ["any","number"]}
    ],[/* NOT */],[
        { operator: "and", pottype: ["any","number"] }
    ],[
        { operator: "or", pottype: ["any","number"] }
    ],[
        { operator: "xor", pottype: ["any","number"] }
    ]

]

function parseObject( target: Array<leaf.Prototype> ): Expect<leaf.Prototype> {
    for (let i = 0; i < target.length; i++) {
        const current = target[i]
        if ( leaf.isUnparsed(current) && /\w/.test(current.value[0]) )
            // 半角英数
            if (current.value.at(-1) === "$")
                target[i] = new leaf.Variable(current.value, "string")
            else if (current.value.at(-1) === "@")
                target[i] = new leaf.Variable(current.value, "array")
            else
            target[i] = new leaf.Variable(current.value, "number")
        if ( leaf.isFunc(current) )
            // 関数
            if (current.name.at(-1) === "$")
                target[i].pottype = "string"
            else if (current.name.at(-1) === "@")
                target[i].pottype = "array"
            else
                target[i].pottype = "number"
        if ( leaf.isUnparsed(current) && current.value === "-" ) {
            // -のパース
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

    for (const operators of order) {
        if (!operators[0] /* NOT */) {
            // TODO: notをパースする
        }
        for (let i = 0; i < target.length; i++) {
            const currentLeaf = target[i]
            let opeidx = -1
            if ( (leaf.isUnparsed(currentLeaf)) && leaf.isBinaryOperator(currentLeaf.value) )
                opeidx = operators.findIndex(e=>e.operator === currentLeaf.value)
            if ( (leaf.isUnparsedLogical(currentLeaf)) && leaf.isBinaryOperator(currentLeaf.operation) )
                opeidx = operators.findIndex(e=>e.operator === currentLeaf.operation)
            if (opeidx !== -1) {
                if ( !( 0<i && i<target.length-1 ) )
                    return Expect.error("invalid_operator_placement")
                const prev = target[i-1]
                const nxt = target[i+1]
                // 型の一致を取れないなら殺す
                if ( !(( prev.pottype === nxt.pottype || prev.pottype === "any" || nxt.pottype === "any" ) &&
                    operators[opeidx].pottype.includes(prev.pottype) && operators[opeidx].pottype.includes(nxt.pottype)))
                    // debug
                    {
                        console.log("TYPE_ERROR");console.log(prev);console.log(nxt)

                    return Expect.error("type_error")
                    // debug
                    }
                target.splice(i-1,3,
                    new leaf.binaryOperation(operators[opeidx].operator, prev, nxt)
                )
                i--
                continue
            }
        }
    }

    if (target[1]) {
        console.error("expected_comma error was returned by parseObject.")
        console.error(target)
        return Expect.error("expected_comma")
    }
    return Expect.result(target[0])
}
