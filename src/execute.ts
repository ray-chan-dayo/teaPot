import { executeExpression } from "./executeExpression"
import * as leaf from "./leaves"
import { Expect } from "./libs/expect"
import { splitFirst } from "./libs/miscs"
import { data, procedures } from "./libs/shared"
import { parseArgs } from "./parseArgs"
import { showError } from "./showError"
import { parseSubstitution, substitute } from "./substitute"

export async function jasmineExecute(lines: Array<string>, vars: Record<string, leaf.potValue>): Promise<any> {
    // 実行
    const stack: Array<number> = []
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const section = splitFirst(line, " ")
        switch (section[0]) {
            case "let":{
                const result = parseSubstitution(section[1], vars)
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
                for (let i = 0; i < args.value.length; i++) {
                    const pile = data.pop()
                    if (pile === undefined) return showError(Expect.error("out_of_data"), i)
                    substitute(args.value[i], pile, vars)
                }
            }break
            case "if":{
                // if文
                const condition = /(.*) +then */.exec(section[1])
                if (condition === null) return showError(Expect.error("invalid_if"), i)
                // 条件式のパース
                const result = parseArgs(condition[1])
                if (!result.success) return showError(result, i)
                if (result.value.length !== 1) return showError(Expect.error("invalid_if"), i)
                const conditionResult = executeExpression(result.value[0])
                if (!conditionResult.success) return showError(conditionResult, i)
                if (typeof conditionResult.value !== "number") return showError(Expect.error("type_error"), i)
                // 条件式がfalseの場合はend ifまでスキップ
                if (conditionResult.value === 0) {
                    let ifCount = 1
                    while (ifCount !== 0) {
                        i++
                        const nextLine = lines[i]
                            .split("//")[0].split("'")[0].trim() // コメントと空白の削除
                        if (nextLine.startsWith("if")) ifCount++
                        if (nextLine.startsWith("end if")) ifCount--
                        // end ifがない場合はエラー
                        if (i >= lines.length) return showError(Expect.error("end_if_not_found"), i)
                    }
                }
            }break
            case "do":{
                const operation = splitFirst(section[1], " ")
                switch (operation[0]) {
                    case "until":{
                        const result = parseArgs(operation[1])
                        if (!result.success) return showError(result, i)
                        if (result.value.length !== 1) return showError(Expect.error("invalid_do"), i)
                        const conditionResult = executeExpression(result.value[0])
                        if (!conditionResult.success) return showError(conditionResult, i)
                        if (typeof conditionResult.value !== "number") return showError(Expect.error("type_error"), i)
                        if (conditionResult.value !== 0) {
                            while (splitFirst(lines[i].trimStart(), " ")[0] !== "loop") {
                                if (i >= lines.length) return showError(Expect.error("loop_not_found"), i)
                                i++
                            }
                        }
                    }break
                    case "while":{
                        const result = parseArgs(operation[1])
                        if (!result.success) return showError(result, i)
                        if (result.value.length !== 1) return showError(Expect.error("invalid_do"), i)
                        const conditionResult = executeExpression(result.value[0])
                        if (!conditionResult.success) return showError(conditionResult, i)
                        if (typeof conditionResult.value !== "number") return showError(Expect.error("type_error"), i)
                        if (conditionResult.value === 0) {
                            while (splitFirst(lines[i].trimStart(), " ")[0] !== "loop") {
                                if (i >= lines.length) return showError(Expect.error("loop_not_found"), i)
                                i++
                            }
                        }
                    }break
                    default:{}
                }
            }break
            case "loop":{
                const operation = splitFirst(section[1], " ")
                switch (operation[0]) {
                    case "while":{
                        const result = parseArgs(operation[1])
                        if (!result.success) return showError(result, i)
                        if (result.value.length !== 1) return showError(Expect.error("invalid_loop"), i)
                        const conditionResult = executeExpression(result.value[0])
                        if (!conditionResult.success) return showError(conditionResult, i)
                        if (typeof conditionResult.value !== "number") return showError(Expect.error("type_error"), i)
                        if (conditionResult.value !== 0) {
                            while (splitFirst(lines[i].trimStart(), " ")[0] !== "do") {
                                i--
                            }
                        }
                    }break
                    case "until":{
                        const result = parseArgs(operation[1])
                        if (!result.success) return showError(result, i)
                        if (result.value.length !== 1) return showError(Expect.error("invalid_loop"), i)
                        const conditionResult = executeExpression(result.value[0])
                        if (!conditionResult.success) return showError(conditionResult, i)
                        if (typeof conditionResult.value !== "number") return showError(Expect.error("type_error"), i)
                        if (conditionResult.value === 0) {
                            while (splitFirst(lines[i].trimStart(), " ")[0] !== "do") {
                                i--
                            }
                        }
                    }break
                    default:{
                        return showError(Expect.error("invalid_loop"), i)
                    }
                }
            }break
            case "exit":{
                const operation = splitFirst(section[1], " ")
                switch (operation[0]) {
                    case "do":{
                        stack.push(i)
                        while (splitFirst(lines[i].trimStart(), " ")[0] !== "loop") {
                            if (i >= lines.length) return showError(Expect.error("internal_error"), -1)
                            i++
                        }
                    }break
                    case "loop":{
                        stack.push(i)
                        while (splitFirst(lines[i].trimStart(), " ")[0] !== "end loop") {
                            if (i >= lines.length) return showError(Expect.error("internal_error"), -1)
                            i++
                        }
                    }break
                    default:{
                        return showError(Expect.error("invalid_exit"), i)
                    }
                }
            }break
            case "for":{
                // パース
                const args = parseArgs(section[1], true)
                if (!args.success) return showError(args, i)
                if (args.value.length !== 3 && args.value.length !== 5) return showError(Expect.error("invalid_for"), i)
                if ( !leaf.isUnparsed(args.value[1]) || args.value[1].value !== "to" ) return showError(Expect.error("expected_to"), i)
                if ( args.value.length === 5 && (!leaf.isUnparsed(args.value[3]) || args.value[3].value !== "step") ) return showError(Expect.error("expected_step"), i)
                // 実行
                parseSubstitution(args.value[0], vars)
            }break
            case "next":{
                while (splitFirst(lines[i].trimStart(), " ")[0] !== "for") {
                    if (i <= 0) return showError(Expect.error("for_not_found"), i)
                    i--
                }
                // TODO: for文のパース
                const args = parseArgs(splitFirst(lines[i].trimStart(), " ")[1], true)


            }break
            case "end":return showError(Expect.error("unexpected_end"), i)
            case "stop":return showError(Expect.error("stop"), i)
            case "pause":{
                const args = parseArgs(section[1])
                if (!args.success) return showError(args, i)
                if (args.value.length !== 1) return showError(Expect.error("invalid_args"), i)
                const result = executeExpression(args.value[0])
                if (!result.success) return showError(result, i)
                if (typeof result.value !== "number") return showError(Expect.error("type_error"), i)
                await new Promise<void>(resolve => setTimeout(resolve, (result.value as number)))
            }break
            case "procedure":{
                const args = parseArgs(section[1])
                if (!args.success) return showError(args, i)
                if (args.value.length !== 1 || !leaf.isFunc(args.value[0]) ) return showError(Expect.error("invalid_args"), i)
                if (procedures[args.value[0].name] !== i) return showError(Expect.error("invalid_procedure"), i)
            }break
            case "call":{
                
            }break
            case "function":{
                // end functionまでスキップ
                while (!lines[i].trim()) {
                    i++
                    if (i >= lines.length) return showError(Expect.error("end_function_not_found"), i)
                }
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
                console.log("beep!")
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
                const args = parseArgs(section[1])
                if (!args.success) return showError(args, i)
                if (args.value.length !== 1) showError(Expect.error("invalid_args"), i)
                const result = executeExpression(args.value[0])
                if (!result.success) return showError(result, i)
                const text = result.value
                if (typeof text !== "string") return showError(Expect.error("type_error"), i)
                const voice = new SpeechSynthesisUtterance(text)
                speechSynthesis.speak(voice)
            }break
            case "rem":break
            default:{
                if (section[0] !== "") {
                    // 代入だけパース
                    const result = parseSubstitution(line, vars)
                    if (!result.success) showError(result, i)
                }
            }break

        }
    }
    console.log(vars)
}