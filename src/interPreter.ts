import { splitFirst } from "./libs/miscs"
import { parseArgs } from "./parseArgs"

export function jasmineInterPrinter(text: string) {

    const br = /\r\n|\n|\r/g
    const lines = text.split(br)
    const vars = []
    const data = []
    const pics = []
    const backgrounds = []

    // interprinter
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trimStart()
        const section = splitFirst(line, " ")
        console.log(i,section[0],section[1]?JSON.stringify(parseArgs(section[1])):"")
        // switch (section[0]) {
        //     case "def":
        //     case "end":
        //     case "exit":
        //     case "procedure":
        //         const internalSection = splitFirst(section[1], " ")
        //     case "let":
        //     case "for":
        //     case "while":
        //     case "do":
        //     case "if":
        //     case "else":

        //         break
        //     default:
        //         const args = parseArgs(section[1])
        //         switch (section[0]) {
        //             case "print":
        //                 break
        //             case "pset":
                        
        //                 break
                
        //             default:
        //                 break
        //         }
        //         break
        // }
    }
}

// function extractFirstParentheses(input): Array<string> {
//     const match = input.match(/\(([^)]*)\)/)
//     return match ? match[1] : null
// }
