export const brackets = {
    table: {
        "(": ")",
        "[": "]",
        "{": "}",
    } as const,

    isBeggining(value: string): value is "(" | "[" | "{" {
        return ["(", "[", "{"].includes(value);
    },
    getTerminal(value:"(" | "[" | "{"): string
    {
        return brackets.table[value]
    }
}
