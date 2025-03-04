export type potType = "string" | "number" | "array" | "any" | undefined

export class BitNot {
    type: "not" = "not"
    pottype: potType = "number"
    target: Prototype

    constructor(target: Prototype) {
        this.target = target
    }
}
export function isNot(l:Prototype | undefined):l is BitNot {
    return (l!==undefined && l.type === "not")
}

const binaryOperators = [
    "*",
    "/",
    "%",
    "+",
    "-",
    "=",
    "<>",
    ">",
    "<",
    ">=",
    "<=",
    "and",
    "or",
    "xor"
]
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
export function isBinaryOperator(s:string):s is binaryOperator {
    return binaryOperators.includes(s)
}
export class binaryOperation {
    type: "binary" = "binary"
    pottype: potType = "number"
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
export function isBinaryOperation(l:Prototype | undefined):l is binaryOperation {
    return l !== undefined && l.type === "binary";
}

export class Func {
    type: "function" = "function"
    pottype: potType
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
    pottype: potType = "string"
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
    pottype: potType = "number"
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
    pottype: potType
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
    pottype: potType
    children: Array<Prototype> = []
}
export function isRoundBracket(l:Prototype | undefined):l is RoundBracket {
    return l !== undefined && l.type === "round";
}

export class ArrayLiteral {
    type: "array" = "array"
    pottype: potType = "array"
    elements: Array<Prototype> = []
}
export function isArray(l:Prototype | undefined):l is ArrayLiteral {
    return l !== undefined && l.type === "array";
}

export class ArrayElement {
    type: "elem" = "elem"
    pottype: potType
    arrayName: string
    index: Prototype | undefined
    constructor(arrayName:string) {
        this.arrayName = arrayName
    }
}
export function isArrayElement(l:Prototype | undefined):l is ArrayElement {
    return l !== undefined && l.type === "elem";
}


export class Origin {
    type: "origin" = "origin"
    pottype: potType
    children: Array<Prototype> = []
}

export type logicalOperator = "not" | "and" | "or"
export class UnparsedLogial {
    type: "unparsedlogic" = "unparsedlogic"
    pottype: potType
    operation: logicalOperator
    constructor(operation: logicalOperator) {
        this.operation = operation as logicalOperator
    }
}
export function isUnparsedLogical(l:Prototype | undefined):l is UnparsedLogial {
    return l !== undefined && l.type === "unparsedlogic";
}
export function isLogicalOperator (s:string):s is logicalOperator {
    return ["not","and","or"].includes(s)
}

export function mightBeNumber(l:Prototype) {
    console.log(`${l} is ${(
        isBinaryOperation(l) ||
        isFunc(l) && l.name[l.name.length-1]!=="$" && l.name[l.name.length-1]!=="@" ||
        isNumber(l) ||
        isUnparsed(l) && l.value[l.value.length-1]!=="$" && l.value[l.value.length-1]!=="@"||
        isArrayElement(l) ||
        isNot(l)
    )}`)
    return (
        isBinaryOperation(l) ||
        isFunc(l) && l.name[l.name.length-1]!=="$" && l.name[l.name.length-1]!=="@" ||
        isNumber(l) ||
        isUnparsed(l) && l.value[l.value.length-1]!=="$" && l.value[l.value.length-1]!=="@"||
        isArrayElement(l) ||
        isNot(l)
    )
}
export function mightBeString(l:Prototype) {
    return(
        isBinaryOperation(l) && l.operation === "+" ||
        isFunc(l) && l.name[l.name.length-1]==="$" ||
        isUnparsed(l) && l.value[l.value.length-1]==="$" ||
        isArrayElement(l)
    )
}

// 型エイリアスの定義
export type Prototype = // Coordinate
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
| BitNot