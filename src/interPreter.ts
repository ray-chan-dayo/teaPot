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
    const lines = text.split(br).map((line) => line.trim())
    const stack: Array<number> = []

    const parsed: Array<leaf.node> = []

    const layer: Array<string> = []
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const section = splitFirst(line, " ")
        switch (section[0]) {
            case "let":{

            }break
            case "input":{

            }break
            case "data":
            case "rem":
                // 何もしない
                break
            case "read":{
                const args = parseArgs(section[1])
                if (!args.success) return showError(args, i)
                if (args.value.length === 0) return showError(Expect.error("invalid_args"), i)
                for (const arg of args.value) {
                    if (!leaf.isArrayElement(arg) && !leaf.isVariable(arg)) return showError(Expect.error("variable_expected"), i)
                }
                parsed.push(new leaf.node(section[0], args.value))
            }break
            
            case "if":{
                // if文
                const condition = /(.*) +then */.exec(section[1])
                if (condition === null) return showError(Expect.error("invalid_if"), i)
                // 条件式のパース
                const result = parseArgs(condition[1])
                if (!result.success) return showError(result, i)
                if (result.value.length !== 1) return showError(Expect.error("invalid_if"), i)
                if (result.value[0].pottype !== "number" && result.value[0].pottype !== "any") return showError(Expect.error("type_error"), i)
                parsed.push(new leaf.node(`if`, result.value))
            }break
            case "do":
                layer.push("do","do")
            case "loop": {
                if (layer.pop() !== "do") return showError(Expect.error("unexpected_loop"), i)
                const operation = splitFirst(section[1], " ")
                switch (operation[0]) {
                    case "while":
                    case "until":{
                        const args = parseArgs(operation[1])
                        if (!args.success) return showError(args, i)
                        if (args.value.length !== 1) return showError(Expect.error("invalid_args"), i)
                        if (args.value[0].pottype !== "number" && args.value[0].pottype !== "any") return showError(Expect.error("type_error"), i)
                        parsed.push(new leaf.node(`${section[0]} ${operation[0]}`, args.value))
                    }break
                    case "":{
                        parsed.push(new leaf.node(section[0], []))
                    }
                    default:{
                        return showError(Expect.error("invalid_usage"), i)
                    }
                }
            }break

            case "for": {
                // パース
                const args = parseArgs(section[1], true)
                if (!args.success) return showError(args, i)
                if (args.value.length !== 3 && args.value.length !== 5) return showError(Expect.error("invalid_for"), i)
                if ( !leaf.isBinaryOperation(args.value[0]) || args.value[0].operation !== "=" ) return showError(Expect.error("expected_substitution"), i)
                if ( !leaf.isUnparsed(args.value[1]) || args.value[1].value !== "to" ) return showError(Expect.error("expected_to"), i)
                if ( args.value[2].pottype !== "number" && args.value[2].pottype !== "any" ) return showError(Expect.error("type_error"), i)
                if ( args.value.length === 5 ){
                    if ( args.value.length === 5 && (!leaf.isUnparsed(args.value[3]) || args.value[3].value !== "step") ) return showError(Expect.error("expected_step"), i)
                    if ( args.value.length === 5 && (args.value[4].pottype !== "number" && args.value[4].pottype !== "any") ) return showError(Expect.error("type_error"), i)
                }
                layer.push("for")
                parsed.push(new leaf.node("for", args.value))
            }break
            case "next":
                if (layer.pop() !== "for") return showError(Expect.error("unexpected_next"), i)
            case "stop":
            case "listen":
                if (section[1] !== "") return showError(Expect.error("invalid_args"), i)
                parsed.push(new leaf.node(section[0], []))
                break
            case "if": {
                ifCount++
            }break

            case "end": {
                switch (section[1]) {
                    case "function":
                    case "procedure":
                        if (layer[1]) return showError(Expect.error("not_terminated"), i)
                    case "if":
                        if (layer.pop() !== section[1]) return showError(Expect.error("unexpected_end"), i)
                        parsed.push(new leaf.node(`end ${section[1]}`, []))
                        break
                    case "":
                        parsed.push(new leaf.node("end", []))
                        break
                    default:
                        return showError(Expect.error("invalid_end"), i)
                }
            }break
            case "exit": {
                switch (section[1]) {
                    case "do":
                    case "for":
                    case "procedure":
                        if (layer.includes(section[1])) return showError(Expect.error("unexpected_exit"), i)
                        parsed.push(new leaf.node(`exit ${section[1]}`, []))
                        break
                    case "":
                        parsed.push(new leaf.node("exit", []))
                        break
                    default:
                        return showError(Expect.error("invalid_exit"), i)
                }
            }break

            case "cls":
                // 範囲外の数値リテラルの場合警告出すと優しいかも
            case "background":
            case "pause":{
                const args = parseArgs(section[1])
                if (!args.success) return showError(args, i)
                if (args.value.length !== 1) return showError(Expect.error("invalid_args"), i)
                if (args.value[0].pottype !== "number" && args.value[0].pottype !== "any") return showError(Expect.error("type_error"), i)
                parsed.push(new leaf.node(section[0], args.value))
            }break

            case "function": {
                // layerのチェック
                if (layer[0]) return showError(Expect.error("invalid_function_declear_placement"), i)
                
                const funcArgs = parseArgs(section[1])
                if (!funcArgs.success) return showError(funcArgs, i)
                if (funcArgs.value.length !== 1 || !leaf.isFunc(funcArgs.value[0])) return showError(Expect.error("invalid_args"), i)
                // ここに予約語のチェックを入れる
                functions[funcArgs.value[0].name] = i
            }break

            case "call": {

            }
            case "procedure": {
                // layerのチェック
                if (layer[0]) return showError(Expect.error("invalid_procedure_declear_placement"), i)
                
                const procArgs = parseArgs(section[1])
                if (!procArgs.success) return showError(procArgs, i)
                if (procArgs.value.length !== 1 || !leaf.isFunc(procArgs.value[0])) return showError(Expect.error("invalid_args"), i)
                // ここに予約語のチェックを入れる
                procedures[procArgs.value[0].name] = i
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
            case "render":{

            }break
            case "print":{

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
            default:{
                if (section[0] !== "") {
                    // 代入だけパース
                    const result = parseSubstitution(line, vars)
                    if (!result.success) showError(result, i)
                }
            }break
        }
    }
}
