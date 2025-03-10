import * as leaf from "./leaves"
import { Expect } from "./libs/expect"

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

] as const

export function parseExpression( target: Array<leaf.Prototype> ): Expect<leaf.Prototype> {
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
                    new leaf.NumberLiteral((target[i+1] as leaf.NumberLiteral).value * -1)
                )
            else
                target.splice(i,2,
                    new leaf.binaryOperation("*", new leaf.NumberLiteral(-1), target[i+1])
                )
            i-=2
        }
    }

    for (const operators of order) {

        if (!operators[0] /* NOT */)
            for (let i = 0; i < target.length; i++) {
                const currentLeaf = target[i];
                if ( leaf.isUnparsedLogical(currentLeaf) && currentLeaf.operation === "not") {

                    if ( i<target.length-1 )
                        return Expect.error("invalid_not_placement")
                    const nxt = target[i+1]
                    if ( nxt.pottype !== "number" && nxt.pottype !== "any" && !( leaf.isUnparsedLogical(nxt) && nxt.operation === "not" ) )
                        return Expect.error("invalid_not")
                    if ( leaf.isNumber(nxt) )
                        target.splice(i-1,3, new leaf.NumberLiteral(
                            // ~はnot
                            ~ Math.round( nxt.value )
                        ))
                    else
                        target.splice(i-1,3, new leaf.BitNot(nxt) )
                    i--
                }
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
        console.error("expected_comma error was returned by parseExpression.")
        console.error(target)
        return Expect.error("expected_comma")
    }
    
    return Expect.result(target[0])
}
