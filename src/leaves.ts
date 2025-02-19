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
    args: Array<Prototype>

    constructor(name: string, args: Array<Prototype>) {
        this.name = name
        this.args = args
    }
}

export class StringLiteral {
    type: "string" = "string"
    value: string

    constructor(value: string) {
        this.value = value
    }
}

export class NumberLiteral {
    type: "number" = "number"
    value: number

    constructor(value: number) {
        this.value = value
    }
}

export class Unparsed {
    type: "unparsed" = "unparsed"
    value: string

    constructor(value: string) {
        this.value = value
    }
}

export class RoundBracket {
    type: "round" = "round"
    children: Array<Prototype> = []
}

export class SquareBracket {
    type: "round" = "round"
    children: Array<Prototype> = []
}

export class Origin {
    type: "origin" = "origin"
    children: Array<Prototype> = []
}

export function isUnparsed(l:Prototype):l is Unparsed {
    return l.type === "unparsed"
}

// 型エイリアスの定義
export type Prototype = Coordinate | Arithmetic | Func | StringLiteral | NumberLiteral | Unparsed
