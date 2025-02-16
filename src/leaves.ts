export type leaf = stringLiteral
 | numberLiteral
 | unparsed
 | coordinate
 | arithmetic
 | func
type stringLiteral = {
    type: "string",
    value: string
}

type numberLiteral = {
    type: "number",
    value: number
}

type unparsed = {
    type: "unparsed",
    value: string
}

type coordinate = {
    type: "coordinate",
    x: numberLiteral,
    y: numberLiteral
}

type arithmetic = {
    type: "arithmetic",
    operation: "" | "" | "" | ""
}

type func = {
    type: "function",
    name: string,
    args: Array<leaf>
}
