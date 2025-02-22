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
        switch (section[0]) {
            case "def":
            case "end":
            case "exit":
            case "procedure":
                const internalSection = splitFirst(section[1], " ")
            case "let":
            case "for":
            case "while":
            case "do":
            case "if":
            case "else":

                break
            default:
                const args = parseArgs(section[1])
                switch (section[0]) {
                    case "print":
                        console.log()
                        break
                    case "pset":
                        
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
