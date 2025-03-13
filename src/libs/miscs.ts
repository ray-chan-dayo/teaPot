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

export const br = /\r\n|\n|\r/g

export const reserved = (()=>{
    const ret: Array<string> = []
    ;[
        "abs", 
        "asc", 
        "beep", 
        "bgmadd", 
        "bgmplay", 
        "bgmstate", 
        "bgmstop", 
        "box", 
        "call", 
        "chr", 
        "circle", 
        "cls", 
        "cos", 
        "crash", 
        "data", 
        "def", 
        "direction", 
        "distance", 
        "do", 
        "elemtype", 
        "else", 
        "end", 
        "exit", 
        "for", 
        "function", 
        "hear", 
        "hide", 
        "if", 
        "include", 
        "inkey", 
        "input", 
        "left", 
        "len", 
        "let", 
        "line", 
        "list", 
        "listening", 
        "load", 
        "locate", 
        "loop", 
        "max", 
        "mid", 
        "min", 
        "move", 
        "moving", 
        "new", 
        "next", 
        "paint", 
        "pause", 
        "pi", 
        "pic", 
        "play", 
        "point", 
        "pow", 
        "print", 
        "procedure", 
        "pset", 
        "put", 
        "random", 
        "read", 
        "ref", 
        "rem", 
        "return", 
        "right", 
        "roll", 
        "round", 
        "run", 
        "save", 
        "scr", 
        "sgn", 
        "show", 
        "sin", 
        "speed", 
        "sprite", 
        "sqr", 
        "stay", 
        "step", 
        "stop", 
        "str", 
        "tan", 
        "tap", 
        "then", 
        "time", 
        "to", 
        "touch", 
        "truncate", 
        "turn", 
        "until", 
        "val", 
        "while", 
        "write"
    ].forEach(word=>{
        ret.push(word)
        ret.push(word+"$")
        ret.push(word+"@")
    })
    return ret
})()