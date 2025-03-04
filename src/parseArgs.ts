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
                /\d+.\d+|\w+|[<>=]+|./g
            )?.forEach(e=>unparsed.push(new leaf.Unparsed(e.toLowerCase())))
        }
    }

    const parsed:Array<leaf.Prototype> = []

    // const currentBrackets:Array<string> = []
    const pending: Array<Array<leaf.Prototype>> = [[]]
    // const pushTarget = parsed
    let isPrevSpace = true
    // let isPotentiallyArrayElement = false
    // let isPotentiallyFunction = false
    // エラー表示をしやすくするためにisObjectExpectedを作る。
    let isObjectExpected = true
    for (let i = 0; i < unparsed.length; i++) {
        const current = unparsed[i]
        if (leaf.isString(current)) { pending[0].push(current); continue }
        if (leaf.isUnparsed(current)) {
            
            if (current.value === " ") { isPrevSpace = true; continue }
            isPrevSpace = false
            
            if (/\w/.test(current.value)) {
                // typeErrorされた。こっちが通るのは釈然としないがとりま。
                // if (/\d/.test(current.value.at(-1))) {
                if (/\d/.test(current.value[current.value.length-1])) {
                    if (/\d+\.?\d*/.test(current.value))
                        pending[0].push(new leaf.NumberLiteral(parseFloat(current.value)))
                }
            }
            if (!/\w/.test(current.value) && current.value !== ",")
                switch (current.value) {
                    case ">":
                    case "<":
                    case "=":
                        if (!relationalOperators.includes(current.value))
                            return Expect.error("invalid_relational_operator")
                        // 落下
                    case "+":
                    case "-":
                    case "*":
                    case "/":
                    case "%":
                        pending[0].push(current)
                        // isPotentiallyArrayElement = false
                        // isPotentiallyFunction = false
                        isObjectExpected = true
                        break
                    case "@":
                        // isPotentiallyArrayElement = true
                    case "$":{
                        const prev = pending[0].pop()
                        if (leaf.isUnparsed(prev) && !/\W/.test(prev.value) && !isPrevSpace)
                            pending[0].push(new leaf.Unparsed(prev.value + current.value))
                        else
                            return Expect.error("invalid_$@")
                    }break
                    case "(":{
                        let currentParent: Array<leaf.Prototype>
                        const prev = pending[0].at(-1)
                        if ( leaf.isUnparsed(prev) && (/\w/.test(prev.value) || prev.value.at(-1)==="$" || prev.value.at(-1)==="@") ) {
                            // function化の処理
                            // 下の配列添え字の処理と統合した方がスマートかな？後でやってみたい。
                            const prev = pending[0].pop()
                            if (!leaf.isUnparsed(prev)) {
                                console.error(`isPotentiallyFunction is true but prev was not unparsed. Got: ${prev}`)
                                return Expect.error("internal_error")
                            }
                            const funcName = prev.value
                            pending[0].push(new leaf.Func(funcName))
                            // 今pushしたばかりのleafを取得
                            currentParent = (pending[0].at(-1) as leaf.Func).args
                        }
                        else {
                            // 丸括弧の処理
                            if (!isObjectExpected) return Expect.error("comma_expected")
                            pending[0].push(new leaf.RoundBracket())
                            currentParent = (pending[0].at(-1) as leaf.RoundBracket).children
                        }

                        // isPotentiallyArrayElement = false
                        // isPotentiallyFunction = false
                    }break

                    case "[":{
                        const prev = pending[0].at(-1)
                        if (!isPrevSpace && leaf.isUnparsed(prev) && /\W/.test(prev.value)) 
                        {
                            if (isObjectExpected) {
                                console.error(`isObjectExpected is true dispite ArrayElement was about to construct. prev:${JSON.stringify(prev)}`)
                                return Expect.error("internal_error")
                            }
                            pending[0].push(new leaf.ArrayElement(prev.value))
                            pending.unshift([])
                        } else {
                            // 配列の生成
                            if (!isObjectExpected) return Expect.error("comma_expected")
                            pending[0].push(new leaf.ArrayLiteral())
                            pending.unshift([])
                        }

                        isObjectExpected = true
                        // isPotentiallyArrayElement = true
                        // isPotentiallyFunction = false
                    }break
                    case "]":
                        // isPotentiallyArrayElement = true
                    case ")":
                        // isPotentiallyFunction = false
                        // 閉じ括弧の処理
                        // 階層化されている
                        if (pending[1]) {
                            
                        } else {
                            parsed.push()
                        }
                        break

                    default:
                        console.error(`unexpected Special Letter: ${current.value}`)
                        return Expect.error("unexpected_letter")
                }
            if (current.value === ",") {
                // pendingをpushTargetに移動する処理
                // 2項演算子の処理
            }
        }
    }
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

    // 先にマイナスをパースする

    for (const operators of order) {
        if (!operators[0] /* NOT */) {
            // notをパースする
        }
        for (let i = 0; i < target.length; i++) {
            const currentLeaf = target[i]
            let opeidx
            if ( (leaf.isUnparsed(currentLeaf)) && leaf.isBinaryOperator(currentLeaf.value) )
                opeidx = operators.findIndex(e=>e.operator === currentLeaf.value)
            if ( (leaf.isUnparsedLogical(currentLeaf)) && leaf.isBinaryOperator(currentLeaf.operation) )
                opeidx = operators.findIndex(e=>e.operator === currentLeaf.operation)
            if (opeidx && opeidx !== -1) {
                if ( !( 0<i && i<target.length-1 ) )
                    return Expect.error("invalid_operator_placement")
                const prev = target[i-1]
                const nxt = target[i+1]
                // 型の一致を取れないなら殺す
                if ( !(( prev.pottype === nxt.pottype || prev.pottype === "any" || nxt.pottype === "any" ) &&
                    operators[opeidx].pottype.includes(prev.pottype) && operators[opeidx].pottype.includes(nxt.pottype)))
                    // debug
                    {console.log("TYPE_ERROR");console.log(prev);console.log(nxt)

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
        console.error("no_comma error was returned by parseObject.")
        return Expect.error("no_comma")
    }
    return Expect.result(target[0])
}
