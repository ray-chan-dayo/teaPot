export function isDecimalNumber(input: string): boolean {
    const decimalPattern = /^-?\d+(\.\d+)?$/
    return decimalPattern.test(input.trim())
}

export function splitFirst(input: string, delimiter:string): Array<string> {
    const index = input.indexOf(delimiter)
    if (index === -1) {
        // 区切り文字が見つからない場合は元の文字列をそのまま返す
        return [input]
    }
    return [input.slice(0, index), input.slice(index + delimiter.length).trimStart()]
}

export const relationalOperators = [
    "=",
    "<>",
    ">",
    "<",
    ">=",
    "<=",
]

export const logicalOperators = [
    "not",
    "and",
    "or"
]