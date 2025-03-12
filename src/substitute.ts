import { parseArgs } from "./parseArgs"
import * as leaf from "./leaves"
import { Expect } from "./libs/expect"
import { executeExpression } from "./executeExpression"
import { vars } from "./libs/shared"

export function substitute(expression: string): Expect<undefined> {
    const exp = parseArgs(expression)
    if (!exp.success)
        return exp
    console.log(exp)
    console.log(exp)
    if ( exp.value.length !== 1 )
        return Expect.error("invalid_let")
    const declearing = exp.value[0]
    if (leaf.isBinaryOperation(declearing) && declearing.operation === "=") {
        const variable = declearing.left
        if (leaf.isVariable(variable) || leaf.isArrayElement(variable)) {
            const value = executeExpression(declearing.right)
            if (!value.success)
                return value
            // type check
            if ( !(
                (typeof value.value === "number" && (variable.pottype === "number" || variable.pottype === "any")) ||
                (typeof value.value === "string" && (variable.pottype === "string" || variable.pottype === "any")) ||
                (Array.isArray(value.value) && (variable.pottype === "array" || variable.pottype === "any"))
            ))
                return Expect.error("type_error")
            if (leaf.isVariable(variable))
                vars[variable.name] = value.value
            else if (leaf.isArrayElement(variable)) {
                if (leaf.isArrayLiteral(variable.array))
                    return Expect.error("substituting_array_literal")
            }
        } else {
            return Expect.error("invalid_let")
        }
    }
    return Expect.result(undefined)
}