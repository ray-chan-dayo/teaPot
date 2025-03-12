import { parseExpression } from './parseExpression';
import * as leaf from './leaves';
import { vars } from './libs/shared';
import { Expect } from './libs/expect';

// カスみたいな再帰関数の実装をしてしまったので、後で書き直す。

const binaryOperators = [
    { operator: "*", pottype: "number" },
    { operator: "/", pottype: "number" },
    { operator: "%", pottype: "number" },
    { operator: "+", pottype: "any" },
    { operator: "-", pottype: "number" },
    { operator: "=", pottype: "any" },
    { operator: "<>", pottype: "any" },
    { operator: ">", pottype: "number" },
    { operator: "<", pottype: "number" },
    { operator: ">=", pottype: "number" },
    { operator: "<=", pottype: "number" },
    { operator: "and", pottype: "number" },
    { operator: "or", pottype: "number" },
    { operator: "xor", pottype: "number" }
]

export function executeExpression(expression: leaf.Prototype): Expect<leaf.potValue> {
    if (leaf.isNumber(expression))
        return Expect.result(expression.value);
    if (leaf.isString(expression))
        return Expect.result(expression.value);
    if (leaf.isVariable(expression)) {
        if (vars[expression.name] === undefined)
            return Expect.error(`Variable ${expression.name} is undefined`);
        return Expect.result(vars[expression.name]);
    }
    if (leaf.isArrayLiteral(expression)) {
        const result = expression.elements.map(executeExpression);
        if (result.some(r => Expect.isError(r))) {
            return result.find(r => !r.success) as Expect<leaf.potValue>;
        } 
        return Expect.result(
            result.map(r => r.success ? r.value : (()=>{console.error("Fatal error during parsing array.");return undefined})())
        )
    }
    if (leaf.isBinaryOperation(expression)) {
        const left = executeExpression(expression.left);
        const right = executeExpression(expression.right);
        if (!left.success)
            return left
        if (!right.success)
            return right
        // type check
        if (["+", "=", "<>"].includes(expression.operation))
            if (typeof left.value !== typeof right.value)
                return Expect.error("type_error")
        else if (typeof left.value !== "number" || typeof right.value !== "number")
            return Expect.error("type_error")

        if (left.value === undefined || right.value === undefined) {
            console.error(`Undefined value in binary operation ${expression}`);
            return Expect.error("internal_error")
        }
        switch (expression.operation) {
            case "+":
                if (typeof left.value === "string" && typeof right.value === "string")
                    return Expect.result(left.value.toString() + right.value.toString());
                else if (typeof left.value === "number" && typeof right.value === "number")
                    return Expect.result(left.value + right.value);
                else if (Array.isArray(left.value) && Array.isArray(right.value))
                    return Expect.result(left.value.concat(right.value));
                else
                    return Expect.error("type_error");
            case "-":
                // なんで型推論効かないのかがマジで謎
                if (typeof left.value !== "number" || typeof right.value !== "number") {
                    console.error(`Invalid type ${expression}`);
                    return Expect.error("internal_error");
                }
                return Expect.result(left.value - right.value);
            case "*":
                if (typeof left.value !== "number" || typeof right.value !== "number") {
                    console.error(`Invalid type ${expression}`);
                    return Expect.error("internal_error");
                }
                return Expect.result(left.value * right.value);
            case "/":
                if (typeof left.value !== "number" || typeof right.value !== "number") {
                    console.error(`Invalid type ${expression}`);
                    return Expect.error("internal_error");
                }
                return Expect.result(left.value / right.value);
            case "%":
                if (typeof left.value !== "number" || typeof right.value !== "number") {
                    console.error(`Invalid type ${expression}`);
                    return Expect.error("internal_error");
                }
                return Expect.result(left.value % right.value);
            case "=":
                return Expect.result(left.value === right.value ? -1 : 0);
            case "<>":
                return Expect.result(left.value !== right.value ? -1 : 0);
            case ">":
                return Expect.result(left.value > right.value ? -1 : 0);
            case "<":
                return Expect.result(left.value < right.value ? -1 : 0);
            case ">=":
                return Expect.result(left.value >= right.value ? -1 : 0);
            case "<=":
                return Expect.result(left.value <= right.value ? -1 : 0);
            case "and":
                if (typeof left.value !== "number" || typeof right.value !== "number") {
                    console.error(`Invalid type ${expression}`);
                    return Expect.error("internal_error");
                }
                return Expect.result(Math.round(left.value) & Math.round(right.value));
            case "or":
                if (typeof left.value !== "number" || typeof right.value !== "number") {
                    console.error(`Invalid type ${expression}`);
                    return Expect.error("internal_error");
                }
                return Expect.result(Math.round(left.value) | Math.round(right.value));
            case "xor":
                if (typeof left.value !== "number" || typeof right.value !== "number") {
                    console.error(`Invalid type ${expression}`);
                    return Expect.error("internal_error");
                }
                return Expect.result(Math.round(left.value) ^ Math.round(right.value));
            default:
                console.error(`Unknown operator ${expression.operation}`);
                return Expect.error("internal_error");
        }
    }
    return Expect.error("Unknown expression type");
}