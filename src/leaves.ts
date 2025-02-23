export class Coordinate {
    type: "coordinate" = "coordinate"
    x: number
    y: number

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }
}

export type binaryOperator = "*" |
"/" |
"%" |
"+" |
"-" |
"=" |
"<>" |
">" |
"<" |
">=" |
"<=" |
"and" |
"or" |
"xor"

export class binaryOperation {
    type: "binary" = "binary"
    operation:binaryOperator
    a:Prototype
    b:Prototype

    constructor(operation:binaryOperator,
        a:Prototype,
        b:Prototype
    ) {
        this.operation = operation
        this.a = a
        this.b = b
    }
}

export class Func {
    type: "function" = "function"
    name: string
    args: Array<Prototype> = []

    constructor(name: string ) {
        this.name = name
    }
}
export function isFunc(l:Prototype | undefined):l is Func {
    return l !== undefined && l.type === "function";
}

export class StringLiteral {
    type: "string" = "string"
    value: string

    constructor(value: string) {
        this.value = value
    }
}
export function isString(l:Prototype):l is StringLiteral {
    return l.type === "string"
}

export class NumberLiteral {
    type: "number" = "number"
    value: number

    constructor(value: number) {
        this.value = value
    }
}
export function isNumber(l:Prototype | undefined):l is NumberLiteral {
    return l !== undefined && l.type === "number";
}

export class Unparsed {
    type: "unparsed" = "unparsed"
    value: string

    constructor(value: string) {
        this.value = value
    }
}

export function isUnparsed(l:Prototype | undefined):l is Unparsed {
    return l !== undefined && l.type === "unparsed";
}

export class RoundBracket {
    type: "round" = "round"
    children: Array<Prototype> = []
}
export function isRoundBracket(l:Prototype | undefined):l is RoundBracket {
    return l !== undefined && l.type === "round";
}

export class ArrayLiteral {
    type: "array" = "array"
    elements: Array<Prototype> = []
}
export function isArray(l:Prototype | undefined):l is ArrayLiteral {
    return l !== undefined && l.type === "array";
}

export class ArrayElement {
    type: "elem" = "elem"
    arrayName: string
    index: Array<Prototype> = []
    constructor(arrayName:string) {
        this.arrayName = arrayName
    }
}
export function isArrayElement(l:Prototype | undefined):l is ArrayElement {
    return l !== undefined && l.type === "elem";
}


export class Origin {
    type: "origin" = "origin"
    children: Array<Prototype> = []
}

export type logicalOperator = "not" | "and" | "or"
export class UnparsedLogial {
    type: "unparsedlogic" = "unparsedlogic"
    operation: logicalOperator
    constructor(operation: logicalOperator) {
        this.operation = operation.toLowerCase() as logicalOperator
    }
}
export function isUnparsedLogical(l:Prototype | undefined):l is UnparsedLogial {
    return l !== undefined && l.type === "unparsedlogic";
}
export function isLogicalOperator (s:string):s is logicalOperator {
    return ["not","and","or"].includes(s.toLowerCase())
}

// 型エイリアスの定義
export type Prototype = Coordinate
| binaryOperation
| Func
| StringLiteral
| NumberLiteral
| Unparsed
| RoundBracket
| ArrayLiteral
| ArrayElement
| Origin
| UnparsedLogial

export type Mathable = binaryOperation
| Func
| NumberLiteral
| Unparsed
| ArrayElement
