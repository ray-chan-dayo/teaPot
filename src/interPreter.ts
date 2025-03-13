import * as leaf from "./leaves"
import { Expect } from "./libs/expect"
import { splitFirst } from "./libs/miscs"
import { parseArgs } from "./parseArgs"
import { showError } from "./showError"
import { parseSubstitution, substitute } from "./substitute"
import { jasmineDataPicker } from "./dataPicker"
import { executeExpression } from "./executeExpression"
import { data, functions, procedures } from "./libs/shared"

// 史上最悪でカスな実装をするが後ほどリファクタリングする

export async function jasmineInterPreter(text: string, isFor: boolean = false): Promise<any> {
    
    // data
    const dataResult = jasmineDataPicker(text)
    if (!dataResult.success) return showError(dataResult, -1)
    
    const br = /\r\n|\n|\r/g
    const vars: Record<string, leaf.potValue> = {}
    const lines = text.split(br)
    const stack: Array<number> = []

    // ここからカス
    // do-loop, if-end if, for-nextが正しく対応して存在するかどうかを確認する
    // ついでにfunctionをパースしておく
    let doCount = 0
    let ifCount = 0
    let forCount = 0
    let functionCount = 0
    let procedureCount = 0
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
            .split("//")[0].split("'")[0].trim() // コメントと空白の削除
        const section = splitFirst(line, " ")
        if (section[0] === "do") doCount++
        if (section[0] === "loop") doCount--
        if (section[0] === "for") forCount++
        if (section[0] === "next") forCount--
        if (section[0] === "if") ifCount++
        if (section[0] === "end" && section[1] == "if") ifCount--
        if (section[0] === "function") {
            const args = parseArgs(section[1])
            if (doCount !== 0 || forCount !== 0 || ifCount !== 0 || functionCount !== 0 || procedureCount !== 0) return showError(Expect.error("invalid_function_declear_placement"), i)
            if (!args.success) return showError(args, i)
            if (args.value.length !== 1 || !leaf.isFunc(args.value[0]) ) return showError(Expect.error("invalid_args"), i)
            // ここに予約語のチェックを入れる
            functions[args.value[0].name] = i
            functionCount++
        }
        if (section[0] === "end" && section[1] == "function") {
            functionCount--
            if (doCount !== 0 || forCount !== 0 || ifCount !== 0 || functionCount !== 0 || procedureCount !== 0) return showError(Expect.error("no_end"), i)
        }
        if (section[0] === "procedure") {
            // 上の処理を流用
            const args = parseArgs(section[1])
            if (doCount !== 0 || forCount !== 0 || ifCount !== 0 || functionCount !== 0 || procedureCount !== 0) return showError(Expect.error("invalid_procedure_declear_placement"), i)
            if (!args.success) return showError(args, i)
            if (args.value.length !== 1 || !leaf.isFunc(args.value[0]) ) return showError(Expect.error("invalid_args"), i)
            // ここに予約語のチェックを入れる
            procedures[args.value[0].name] = i
            procedureCount++
        }
        if (section[0] === "end" && section[1] == "procedure") {
            procedureCount--
            if (doCount !== 0 || forCount !== 0 || ifCount !== 0 || functionCount !== 0 || procedureCount !== 0) return showError(Expect.error("no_end"), i)
        }
    }



    // 実行
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trimStart()
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
                        const nextLine = lines[i].trimStart()
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
