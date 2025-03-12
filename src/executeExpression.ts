import { parseExpression } from './parseExpression';
import * as leaf from './leaves';
export function executeExpression(expression: leaf.Prototype): any {
    // without recursive
    
    // 各配列に対して
    for (
        const i:Array<number> = [0]
        ,     arr:Array<Array<leaf.Prototype>>=[targetLeaves];
        i[0] < targetLeaves.length;
        i[arr.length-1]++
    ) {
        const depth = arr.length-1
        if (!(i[depth] < arr[depth].length)) {
            const ret = callback(arr[depth])
            if (ret && !ret.success)
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
        if (leaf.isBinaryOperation(curr)) {
            arr.push([curr.a,curr.b])
        }
    }
    const ret = callback(targetLeaves)
    if (ret && !ret.success)
        return ret
}