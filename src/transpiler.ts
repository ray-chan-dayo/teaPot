import { splitFirst } from "./libs/miscs"
import { parseExpression } from "./parseExpression"

export function jasmineTranspiler(text: string): void {

    const lines = text.split("\n")
    const vars = []
    const data = []
    const pics = []
    const backgrounds = []

    // データの処理

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trimStart()
        const section = splitFirst(line, " ")
        const args = section[1]
        switch (section[0]) {
            case "let":{
                const args = /(\w+[$@]?) *= *(.*)/
            }break
            case "input":{

            }break
            case "data":{

            }break
            case "read":{

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
            default:
                break

        }
    }
}
