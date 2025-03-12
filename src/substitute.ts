import { parseArgs } from "./parseArgs"
import { showError } from "./showError"
import * as leaf from "./leaves"
import { Expect } from "./libs/expect"
import { executeExpression } from "./executeExpression"
import { vars } from "./libs/shared"

export function substitute(expression: string, lineNumber: number): Expect<undefined> {
    const exp = parseArgs(expression)
    if (!exp.success)
        return showError(exp, lineNumber)
    if ( exp.value.length !== 1 )
        return showError(Expect.error("invalid_let"), i)
    const declearing = exp.value[0]
    if (leaf.isBinaryOperation(declearing) && declearing.operation === "=") {
        const variable = declearing.left
        if (leaf.isVariable(variable) || leaf.isArrayElement(variable)) {
            const value = executeExpression(declearing.right)
            if (!value.success)
                return showError(value, lineNumber)
            // type check
            if ( !(
                (typeof value.value === "number" && (variable.pottype === "number" || variable.pottype === "any")) ||
                (typeof value.value === "string" && (variable.pottype === "string" || variable.pottype === "any")) ||
                (Array.isArray(value.value) && (variable.pottype === "array" || variable.pottype === "any"))
            ))
                return showError(Expect.error("type_error"), lineNumber)
            if (leaf.isVariable(variable))
                vars[variable.name] = value.value
            else if (leaf.isArrayElement(variable)) {
                if (leaf.isArrayLiteral(variable.array))
                    return showError(Expect.error("substituting_array_literal"), lineNumber)
            }
        } else {
            return showError(Expect.error("invalid_let"), i)
        }
    }
    return Expect.result(undefined)
}