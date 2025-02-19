import { brackets } from "./libs/brackets";
import { Expect } from "./libs/expect"
import * as leaf from "./leaves";

export function parseArgs( input: string ): Expect<Array<leaf.Prototype>> {
    
    const ripped = input.split('"')
    if (ripped.length % 2 !== 1)
        return Expect.error("Invalid Quote")

    const result:Array<leaf.Prototype> = []
    for (let i = 0; i < ripped.length; i++) {
        if (i%2 === 1)
            result.push(new leaf.StringLiteral(ripped[i]))
        else {
            ripped[i].match(/\w+|\W/)?.forEach(e=>result.push(new leaf.Unparsed(e)))
        }
    }

    let isPotentiallyFunction: boolean = false
    ,   isPotentiallyArray: boolean = false
    ,   hasComma: boolean = true
    let currentBrackets:Array<{
        bracketType: string,
    }> = []
    let parent:Array<leaf.Prototype> = []

    for (let i = 0; i < result.length; i++) {
        if (result[i].type === "string")
            if (hasComma) {
                hasComma = false
                isPotentiallyFunction = false
                isPotentiallyArray = false
            } else
                return Expect.error(", expected")
        else
            if ( leaf.isUnparsed(result[i])) {
                const c:string = (result[i] as leaf.Unparsed).value
                if (/\W/.test(c)) {
                    switch (c) {
                        case ",":
                            hasComma = true
                            isPotentiallyArray = false
                            isPotentiallyFunction = false
                            break;
                        case " ":
                            isPotentiallyArray = false
                            isPotentiallyFunction = false
                            break;
                        case "(":
                            
                            break;
                        case "[":
                            
                            break;
                        case ")":
                            
                            break;
                        case "]":
                            
                            break;
                        case "]":
                            
                            break;
                        default:

                            break;
                    }
                }
            } else { //alphanumeric
                
                if (hasComma) {
                    hasComma = false
                    isPotentiallyFunction = true
                    isPotentiallyArray = true
                } else
                    return Expect.error(", expected")
            }
    }
}
