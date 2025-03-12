import { parseArgs } from "./parseArgs"
import * as leaf from "./leaves"
import { Expect } from "./libs/expect"
import { executeExpression } from "./executeExpression"
import { vars } from "./libs/shared"
import { parseExpression } from "./parseExpression"

export function parseSubstitution(expression: string): Expect<undefined> {
    const exp = parseArgs(expression)
    if (!exp.success)
        return exp
    if ( exp.value.length !== 1 )
        return Expect.error("invalid_let")
    const declearing = exp.value[0]
    if (leaf.isBinaryOperation(declearing) && declearing.operation === "=") {
        const variable = declearing.left
        const value = executeExpression(declearing.right)
        if (!value.success) return value
        const result = substitute(variable, value.value)
        if (!result.success) return result
    }
    return Expect.result(undefined)
}

export function substitute(variable: leaf.Prototype, value: leaf.potValue): Expect<undefined> {
    if (leaf.isVariable(variable) || leaf.isArrayElement(variable)) {
        // type check
        if ( !(
            (typeof value === "number" && (variable.pottype === "number" || variable.pottype === "any")) ||
            (typeof value === "string" && (variable.pottype === "string" || variable.pottype === "any")) ||
            (Array.isArray(value) && (variable.pottype === "array" || variable.pottype === "any"))
        ))
            return Expect.error("type_error")
        if (leaf.isVariable(variable)) {
            vars[variable.name] = value
            return Expect.result(undefined)
        }
        else if (leaf.isArrayElement(variable)) {
            let curr: leaf.Prototype = variable
            let index: Array<number> = []
            while (leaf.isArrayElement(curr)) {
                const indexResult = executeExpression(curr.index)
                if (!indexResult.success) return indexResult
                if (typeof indexResult.value !== "number") return Expect.error("invalid_index")
                index.push(indexResult.value)
                curr = curr.array
            }
            if (leaf.isArrayLiteral(curr)) return Expect.error("substituting_array_literal")
            const result = executeExpression(curr)
            if (!result.success) return result
            let address: leaf.potValue = result.value
            for (let i = index.length - 1; 0 < i; i--) {
                console.log(i)
                if (!Array.isArray(address)) return Expect.error("index_non_array")
                if (index[i] >= address.length) return Expect.error("index_out_of_range")
                address = address[index[i]]
            }
            if (!Array.isArray(address)) return Expect.error("index_non_array")
            if (index[0] >= address.length) return Expect.error("index_out_of_range")
            address[index[0]] = value
            return Expect.result(undefined)
        }
    } else {
        return Expect.error("substitute_to_invalid")
    }
}