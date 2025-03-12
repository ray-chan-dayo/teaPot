import { executeExpression } from "./executeExpression"
import * as leaf from "./leaves"
import { Expect } from "./libs/expect"
import { splitFirst } from "./libs/miscs"
import { parseArgs } from "./parseArgs"
import { parseExpression } from "./parseExpression"
import { showError } from "./showError"
import { vars } from "./libs/shared"
import { parseSubstitution } from "./substitute"
import { jasmineDataPicker } from "./dataPicker"

export function jasmineInterPreter(text: string): any {
    const br = /\r\n|\n|\r/g

    const lines = text.split(br)
    // データの処理
    const data = jasmineDataPicker(text)
    // 実行
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trimStart()
        const section = splitFirst(line, " ")
        switch (section[0]) {
            case "let":{
                const result = parseSubstitution(section[1])
                if (!result.success) showError(result, i)
                // 時間ないのとコードの一貫性を保つために
                // result.success || showError(result, i)
            }break
            case "input":{
                
            }break
            case "data":break
            case "read":{
                const args = parseArgs(section[1])
                if (!args.success) return showError(args, i)
                args.value
                if (!leaf.isVariable(variable)) showError(Expect.error("invalid_read"), i)
                vars[variable.name] = data.pop()
            }break
            case "if":{

            }break
            case "do":{

            }break
            case "loop":{

            }break
            case "exit":{

            }break
            case "for":{

            }break
            case "next":{

            }break
            case "end":{

            }break
            case "stop":{

            }break
            case "pause":{

            }break
            case "procedure":{

            }break
            case "call":{

            }break
            case "function":{

            }break
            case "return":{

            }break
            case "tap":{

            }break
            case "show":{

            }break
            case "move":{

            }break
            case "stay":{

            }break
            case "direction":{

            }break
            case "distance":{

            }break
            case "speed":{

            }break
            case "turn":{

            }break
            case "sprite":{

            }break
            case "def":{

            }break
            case "hide":{

            }break
            case "circle":{

            }break
            case "oval":{

            }break
            case "line":{

            }break
            case "box":{

            }break
            case "pset":{

            }break
            case "paint":{

            }break
            case "roll":{

            }break
            case "put":{

            }break
            case "write":{

            }break
            case "cls":{

            }break
            case "render":{

            }break
            case "background":{

            }break
            case "print":{

            }break
            case "cls":{

            }break
            case "locate":{

            }break
            case "beep":{

            }break
            case "play":{

            }break
            case "bgmplay":{

            }break
            case "bgmstop":{

            }break
            case "bgmadd":{

            }break
            case "listen":{

            }break
            case "speak":{

            }break
            default:{

            }break

        }
    }
    console.log(vars)
}
