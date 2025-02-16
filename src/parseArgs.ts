import { brackets } from "./brackets";
import { Expect } from "./expect"

type parseArgsMode = "simple" | "quotes" | "brackets"

export function parseArgs( input: string, mode: parseArgsMode = "simple" ): Expect<Array<string>> {

    let result:Array<string> = []
    let unparsed = input

    switch (mode) {
        case "quotes":
            
            break
        case "brackets":
            let currentBracketEnd = ""

            for (let i = 0; i < input.length; i++)
                if (currentBracketEnd)
                    if (input[i] === currentBracketEnd) {
                        currentBracketEnd = ""
                    }
                else if (brackets.isBeggining(input[i])) {
                    currentBracketEnd = brackets.getTerminal(input[i] as "(" | "[" | "{")
                }
            if ( currentBracketEnd ) return Expect.error(`${currentBracketEnd} was not here`)
            break
        case "simple":
            const result = input.split(/, */)
            for (let i = 0; i < result.length; i++) {
                if (result[i].includes("　")) {
                    return Expect.error(`Invalid space found during parseArgs()`)
                }
            }
            return Expect.result(result)
            break
    }
    return Expect.error(`Internal Error: parseArgs did not return`)
}
