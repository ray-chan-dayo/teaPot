import { splitFirst } from "./libs/miscs"
import { parseArgs } from "./parseArgs"

export function jasmineInterPrinter(text: string) {

    const lines = text.split("\n")
    const vars = []
    const data = []
    const pics = []
    const backgrounds = []

    // interprinter
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trimStart()
        const section = splitFirst(line, " ")
        const args = section[1]
        switch (section[0]) {
            case "def":
            case "end":
            case "exit":
            case "for":
            case "while":
            case "do":
            case "if":
            case "else":
            case "let":
            case "const":
            case "var":

                break
            default:
                parseArgs(args)
                switch (section[0]) {
                    case "print":
                        parseArgs
                        console.log(parseString(args))
                        break
                    case "def":
                        
                        break
                
                    default:
                        break
                }
                break
        }
    }
}

// function extractFirstParentheses(input): Array<string> {
//     const match = input.match(/\(([^)]*)\)/)
//     return match ? match[1] : null
// }
