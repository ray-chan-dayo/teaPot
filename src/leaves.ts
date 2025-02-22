export class Coordinate {
    type: "coordinate" = "coordinate"
    x: number
    y: number

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }
}

export class Arithmetic {
    type: "arithmetic" = "arithmetic"
    operation: "+" | "-" | "*" | "/"
    a:Prototype
    b:Prototype

    constructor(operation: "+" | "-" | "*" | "/", a:Prototype, b:Prototype) {
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

export class ArrayLiteral {
    type: "array" = "array"
    elements: Array<Prototype> = []
}

export class ArrayElement {
    type: "elem" = "elem"
    arrayName: string
    index: Array<Prototype> = []
    constructor(arrayName:string) {
        this.arrayName = arrayName
    }
}

export class Origin {
    type: "origin" = "origin"
    children: Array<Prototype> = []
}

// 型エイリアスの定義
export type Prototype = Coordinate
| Arithmetic
| Func
| StringLiteral
| NumberLiteral
| Unparsed
| RoundBracket
| ArrayLiteral
| ArrayElement
| Origin

export type Mathable = Arithmetic
| Func
| NumberLiteral
| Unparsed
| ArrayElement
