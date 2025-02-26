import * as leaf from "./leaves"
import { Expect } from "./libs/expect"
import { betterThanRecursive } from "./betterThanRecursive"

export function parseOperators(target: Array<leaf.Prototype>, operation: Array<leaf.binaryOperator>, isValid: Array<Function>):Expect<void> {

    if (operation.length !== isValid.length) {
        console.error(
            `Unexpected arguments passed to parseOperators(): length of operation and isValid must be same.
            Got:
            ${target.toString()},
            ${operation.toString()},
            ${isValid.toString()}`
        )
        return Expect.error("internal_error")
    }
    return betterThanRecursive(target,
        (target: Array<leaf.Prototype>) => {
            // 2項演算子の処理
            for (let i = 0; i < target.length; i++) {
                const currentLeaf = target[i]
                let opeidx
                if ( (leaf.isUnparsed(currentLeaf)) && leaf.isBinaryOperator(currentLeaf.value) )
                    opeidx = operation.indexOf(currentLeaf.value)
                if ( (leaf.isUnparsedLogical(currentLeaf)) && leaf.isBinaryOperator(currentLeaf.operation) )
                    opeidx = operation.indexOf(currentLeaf.operation)
                if (opeidx) {
                    if ( !( 0<i && i<target.length-1 ) )
                        return Expect.error("invalid_operator_placement")
                    const prev = target[i-1]
                    const nxt = target[i+1]
                    if (!( isValid[opeidx](prev, nxt) ))
                        return Expect.error("invalid_operation")
                    target.splice(i-1,3,
                        new leaf.binaryOperation(operation[opeidx], prev, nxt)
                    )
                    i--
                    continue
                }
            }
        }
    )
}
