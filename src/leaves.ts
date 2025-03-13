export type potType = "string" | "number" | "array" | "any" | undefined

export type potValue<T extends potAny = potAny> = T | undefined
type potAny = number | string | Array<potValue>

export class BitNot {
    type: "not" = "not"
    pottype: potType = "number"
    target: Prototype
    value: potValue<number>

    constructor(target: Prototype) {
        this.target = target
    }
}
export function isNot(l:Prototype | undefined):l is BitNot {
    return (l!==undefined && l.type === "not")
}

const binaryOperators: Array<string> = [
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
    pottype: potType
    operation: binaryOperator
    left: Prototype
    right: Prototype
    value: potValue

    constructor(operation:binaryOperator,
        l: Prototype,
        r: Prototype,
        pottype: potType = "any"
    ) {
        this.operation = operation
        this.pottype = pottype
        this.left = l
        this.right = r
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
    value: potValue

    constructor(name: string, pottype: potType) {
        this.name = name
        this.pottype = pottype
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

export class Variable {
    type: "variable" = "variable"
    pottype: potType
    name: string
    value: potValue

    constructor(name: string, pottype: potType) {
        this.name = name,
        this.pottype = pottype
    }
}

export function isVariable(l:Prototype | undefined):l is Variable {
    return l !== undefined && l.type === "variable";
}

export class RoundBracket {
    type: "round" = "round"
    pottype: potType
    children: Array<Prototype> = []
    value: potValue
}
export function isRoundBracket(l:Prototype | undefined):l is RoundBracket {
    return l !== undefined && l.type === "round";
}

export class ArrayLiteral {
    type: "array" = "array"
    pottype: potType = "array"
    elements: Array<Prototype> = []
    value: potValue
}
export function isArrayLiteral(l:Prototype | undefined):l is ArrayLiteral {
    return l !== undefined && l.type === "array";
}

export class UnparsedArrayElement {
    type: "unparsedelem" = "unparsedelem"
    pottype: potType = "any"
    array: Prototype
    value: undefined
    constructor(array:Prototype) {      
        this.array = array
    }
}

export function isUnparsedArrayElement(l:Prototype | undefined):l is UnparsedArrayElement {
    return l !== undefined && l.type === "unparsedelem";
}

export class ArrayElement {
    type: "elem" = "elem"
    pottype: potType = "any"
    array: Prototype
    index: Prototype
    value: potValue
    constructor(array:UnparsedArrayElement, index:Prototype) {
        this.array = array.array
        this.index = index
    }
}

export function isArrayElement(l:Prototype | undefined):l is ArrayElement {
    return l !== undefined && l.type === "elem";
}

export type logicalOperator = "not" | "and" | "or"
export class UnparsedLogial {
    type: "unparsedlogic" = "unparsedlogic"
    pottype: potType = "number"
    value: logicalOperator
    constructor(value: logicalOperator) {
        this.value = value
    }
}
export function isUnparsedLogical(l:Prototype | undefined):l is UnparsedLogial {
    return l !== undefined && l.type === "unparsedlogic";
}
export function isLogicalOperator (s:string):s is logicalOperator {
    return ["not","and","or"].includes(s)
}

export type forParts = "to" | "step"


export function mightBeNumber(l:Prototype) {
    // console.log(`${l} is ${(
    //     isBinaryOperation(l) ||
    //     isFunc(l) && l.name[l.name.length-1]!=="$" && l.name[l.name.length-1]!=="@" ||
    //     isNumber(l) ||
    //     isUnparsed(l) && l.value[l.value.length-1]!=="$" && l.value[l.value.length-1]!=="@"||
    //     isArrayElement(l) ||
    //     isNot(l)
    // )}`)

    // 下に同じく
    return (
        isRoundBracket(l) ||
        isBinaryOperation(l) ||
        isFunc(l) && l.name[l.name.length-1]!=="$" && l.name[l.name.length-1]!=="@" ||
        isUnparsed(l) && l.value[l.value.length-1]!=="$" && l.value[l.value.length-1]!=="@"||
        isNumber(l) ||
        isArrayElement(l) ||
        isNot(l)
    )
}
export function mightBeString(l:Prototype) {
    return(
        // 下に同じく
        isRoundBracket(l) ||
        isBinaryOperation(l) && l.operation === "+" ||
        isFunc(l) && l.name[l.name.length-1]==="$" ||
        isUnparsed(l) && l.value[l.value.length-1]==="$" ||
        isString(l) ||
        isArrayElement(l)
    )
}
export function mightBeArray(l:Prototype) {
    return(
        // この中途半端なパースにかんしてはどげんかしたい
        isRoundBracket(l) ||
        isBinaryOperation(l) && l.operation === "+" ||
        isFunc(l) && l.name[l.name.length-1]==="@" ||
        isUnparsed(l) && l.value[l.value.length-1]==="@" ||
        isArrayLiteral(l) ||
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
| Variable
| RoundBracket
| ArrayLiteral
| UnparsedArrayElement
| ArrayElement
| UnparsedLogial
| BitNot
