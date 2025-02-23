
import * as leaf from "./leaves"
import { Expect } from "./libs/expect"

function parseDecimals(bracketsParsed: Array<leaf.Prototype>) {
    //wrap function
    function callbackfn(target:Array<leaf.Prototype>) {
        // 小数点の処理
        for (let i = 0; i < bracketsParsed.length; i++) {
            if (leaf.isUnparsed(bracketsParsed[i]) && (bracketsParsed[i] as leaf.Unparsed).value === ".") {
                if ( !(0<i &&i<bracketsParsed.length-1) )
                    return Expect.error("unexpected_.")
                const int = bracketsParsed[i-1]
                const decimal = bracketsParsed[i+1]
                if (!(
                    leaf.isNumber(int) &&
                    Number.isInteger(int.value) &&
                    leaf.isNumber(decimal) &&
                    Number.isInteger(int.value)
                ))
                    return Expect.error("unexpected_.")
                bracketsParsed.splice(i-1,2,
                    new leaf.NumberLiteral(Number(`${int}.${decimal}`))
                )
                i--
                continue
            }
        }
    }
    recursive(bracketsParsed, callbackfn)
}

function parseOperators(target: Array<leaf.Prototype>, operation: leaf.binaryOperator, isValid: Function):Expect<void> {
    // wrap function
    function callbackfn(target: Array<leaf.Prototype>) {
        // 2項演算子の処理
        // 小数点の処理を流用した。もし統合できそうならしたいなぁ
        for (let i = 0; i < target.length; i++) {
            if (leaf.isUnparsed(target[i]) && (target[i] as leaf.Unparsed).value === operation) {
                if ( !(0<i &&i<target.length-1) )
                    return Expect.error("unexpected_operator")
                const prev = target[i-1]
                const nxt = target[i+1]
                if (!(
                    isValid(prev) &&
                    isValid(nxt)
                ))
                    return Expect.error("invalid_operation")
                    target.splice(i-1,2,
                    new leaf.binaryOperation(operation, prev, nxt)
                )
                i--
                continue
            }
        }
    }
    return recursive(target, callbackfn)
}

function recursive(targetLeaves: Array<leaf.Prototype>, callback: Function):Expect<void> {
    for (
        const i:Array<number> = [0]
        ,     arr:Array<Array<leaf.Prototype>>=[targetLeaves];
        i[0] < targetLeaves.length;
        i[arr.length-1]++
    ) {
        const depth = arr.length-1
        if (i[depth] < arr[depth].length) {
            const ret = callback(arr[depth])
            if (!ret.success)
                return ret
            arr.pop()
            continue
        }
        const curr = arr[arr.length-1][i[arr.length-1]]

        // 深度
        if (leaf.isArray(curr)) {
            arr.push(curr.elements)
        }
        if (leaf.isArrayElement(curr)) {
            arr.push(curr.index)
        }
        if (leaf.isRoundBracket(curr)) {
            arr.push(curr.children)
        }
        if (leaf.isFunc(curr)) {
            arr.push(curr.args)
        }
    }
    const ret = callback(targetLeaves)
    if (!ret.success)
        return ret
    return Expect.result(undefined)
}