import * as leaf from "./leaves"
import { Expect } from "./libs/expect"
import { splitFirst } from "./libs/miscs"
import { parseArgs } from "./parseArgs"
import { showError } from "./showError"
import { jasmineDataPicker } from "./dataPicker"
import { functions, procedures } from "./libs/shared"

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

            case "data":
            case "rem":
                // 何もしない
                break
            case "input":{
                //todo
            }break
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
                const args = parseArgs(section[1], true)
                if (!args.success) return showError(args, i)
                if (args.value.length !== 3 && args.value.length !== 5) return showError(Expect.error("invalid_for"), i)
                if ( !leaf.isBinaryOperation(args.value[0]) || args.value[0].operation !== "=" || leaf.isVariable(args.value[0].left) ) return showError(Expect.error("expected_substitution"), i)
                if ( !leaf.isUnparsed(args.value[1]) || args.value[1].value !== "to" ) return showError(Expect.error("expected_to"), i)
                if ( args.value[2].pottype !== "number" && args.value[2].pottype !== "any" ) return showError(Expect.error("type_error"), i)
                if ( args.value.length === 5 ){
                    if ( args.value.length === 5 && (!leaf.isUnparsed(args.value[3]) || args.value[3].value !== "step") ) return showError(Expect.error("expected_step"), i)
                    if ( args.value.length === 5 && (args.value[4].pottype !== "number" && args.value[4].pottype !== "any") ) return showError(Expect.error("type_error"), i)
                }
                layer.push("for")
                parsed.push(new leaf.node("for", args.value))
            }break

            case "else":{
                if (layer[layer.length-1] !== "if") return showError(Expect.error("unexpected_else"), i)
                if (section[1] === "") {
                    parsed.push(new leaf.node("else", []))
                    break
                }
                if (splitFirst(section[1], " ")[0] !== "if") return showError(Expect.error("invalid_else"), i)
                section[0] = "else if"
                section[1] = splitFirst(section[1], " ")[1]
            }
            case "if": {
                // if文
                const condition = /(.*) +then */.exec(section[1])
                if (condition === null) return showError(Expect.error("invalid_if"), i)
                // 条件式のパース
                const result = parseArgs(condition[1])
                if (!result.success) return showError(result, i)
                if (result.value.length !== 1) return showError(Expect.error("invalid_if"), i)
                if (result.value[0].pottype !== "number" && result.value[0].pottype !== "any") return showError(Expect.error("type_error"), i)
                layer.push("if")
                parsed.push(new leaf.node(section[0], result.value))
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
                const procedure = splitFirst(section[1].trim(), " ")
                if (procedure[0] === "") return showError(Expect.error("invalid_args"), i)
                if (procedure[1] !== "") {
                    const args = parseArgs(procedure[1])
                    if (!args.success) return showError(args, i)
                    parsed.push(new leaf.node(section[0], [new leaf.Unparsed(procedure[0]), ...args.value]))
                } else
                    parsed.push(new leaf.node(section[0], [new leaf.Unparsed(procedure[0])]))
            }break

            case "procedure": {
                // layerのチェック
                if (layer[0]) return showError(Expect.error("invalid_procedure_declear_placement"), i)
                
                const procArgs = parseArgs(section[1])
                if (!procArgs.success) return showError(procArgs, i)
                if (procArgs.value.length !== 1 || !leaf.isFunc(procArgs.value[0])) return showError(Expect.error("invalid_args"), i)
                // ここに予約語のチェックを入れる
                procedures[procArgs.value[0].name] = i
                layer.push("procedure")
            }break
            case "return":
                if (layer[0] !== "function") return showError(Expect.error("unexpected_return"), i)
            case "bgmadd":{
                const args = parseArgs(section[1])
                if (!args.success) return showError(args, i)
                if (args.value.length !== 1) return showError(Expect.error("invalid_args"), i)
                parsed.push(new leaf.node("return", args.value))
            }break
            case "tap":{
                // substitutable x2-3
                const args = parseArgs(section[1])
                if (!args.success) return showError(args, i)
                if (args.value.length !== 2 && args.value.length !== 3) return showError(Expect.error("invalid_args"), i)
                if ( !leaf.isSubstitutable(args.value[0]) ) return showError(Expect.error("variable_expected"), i)
                if ( !leaf.isSubstitutable(args.value[1]) ) return showError(Expect.error("variable_expected"), i)
                if (args.value.length === 3 && !leaf.isSubstitutable(args.value[2])) return showError(Expect.error("variable_expected"), i)
                parsed.push(new leaf.node(section[0], args.value))
            }break
            case "sprite":{
                // 引数2or3
                const args = parseArgs(section[1])
                if (!args.success) return showError(args, i)
                if (args.value.length !== 2 && args.value.length !== 3) return showError(Expect.error("invalid_args"), i)
                parsed.push(new leaf.node(section[0], args.value))
            }break
            case "def":{
                const operation = splitFirst(section[1], " ")
                if (operation[0] === "") return showError(Expect.error("invalid_args"), i)
                if (operation[1] === "") return showError(Expect.error("invalid_args"), i)
            }break
            // position, string, number, number
            case "write":{
                const args = parseArgs(section[1])
                if (!args.success) return showError(args, i)
                if (args.value.length !== 4) return showError(Expect.error("invalid_args"), i)
                // position
                if ( leaf.isPosition(args.value[0]) ) return showError(Expect.error("invalid_args"), i)
                // string
                if (args.value[1].pottype !== "string" && args.value[1].pottype !== "any") return showError(Expect.error("type_error"), i)
                // number
                if (args.value[2].pottype !== "number" && args.value[2].pottype !== "any") return showError(Expect.error("type_error"), i)
                // number
                if (args.value[3].pottype !== "number" && args.value[3].pottype !== "any") return showError(Expect.error("type_error"), i)
                parsed.push(new leaf.node(section[0], args.value))
            }break
            case "print":{
                //;で区切る。但し""で囲まれたものは除く
                const ripped = section[1].trim().split('"').map((v, i) => i % 2 === 0 ? v.split(";") : [v])
                // 鍵かっこが成立していない場合
                if (ripped.length < 3) {
                    parsed.push(new leaf.node("print", [new leaf.StringLiteral(section[1])]))
                    break
                }
                const unparsedArgs: Array<string> = []
                    
                for (let i = 0; i < ripped.length-1; i++) {
                    if (i % 2 === 0) {
                        for (let j = 0; j < ripped[i].length-1; j++) {
                            unparsedArgs.push(ripped[i][j])
                        }
                    }
                }
                const args = unparsedArgs.map((v) => parseArgs(v))
            }break
            case "beep":{
                // number 0 or 3
                if (section[1] === "") {
                    parsed.push(new leaf.node(section[0], []))
                    break
                }
                const args = parseArgs(section[1])
                if (!args.success) return showError(args, i)
                if (args.value.length !== 0 && args.value.length !== 3) return showError(Expect.error("invalid_args"), i)
                if (args.value[0].pottype !== "number" && args.value[0].pottype !== "any") return showError(Expect.error("type_error"), i)
                if (args.value[1].pottype !== "number" && args.value[1].pottype !== "any") return showError(Expect.error("type_error"), i)
                if (args.value[2].pottype !== "number" && args.value[2].pottype !== "any") return showError(Expect.error("type_error"), i)
                parsed.push(new leaf.node(section[0], args.value))
            }break
            case "play":{
                // 可変長引数
                const args = parseArgs(section[1])
                if (!args.success) return showError(args, i)
                parsed.push(new leaf.node("play", args.value))
            }break

            // 以下は引数によって分ける

            // 引数無し
            case "next":
                if (layer.pop() !== "for") return showError(Expect.error("unexpected_next"), i)
            case "stop":
            case "listen":
            case "bgmstop":
                if (section[1] !== "") return showError(Expect.error("invalid_args"), i)
                parsed.push(new leaf.node(section[0], []))
                break

            // number
            case "bgmplay":
            case "render":
            case "cls":
                // 範囲外の数値リテラルの場合警告出すと優しいかも
            case "background":
            case "pause":
            case "move":
            case "turn":
            case "stay":
            case "hide":{
                const args = parseArgs(section[1])
                if (!args.success) return showError(args, i)
                if (args.value.length !== 1) return showError(Expect.error("invalid_args"), i)
                if (args.value[0].pottype !== "number" && args.value[0].pottype !== "any") return showError(Expect.error("type_error"), i)
                parsed.push(new leaf.node(section[0], args.value))
            }break
            
            // string
            case "speak":{
                const args = parseArgs(section[1])
                if (!args.success) return showError(args, i)
                if (args.value.length !== 1) showError(Expect.error("invalid_args"), i)
                if (args.value[0].pottype !== "string" && args.value[0].pottype !== "any") showError(Expect.error("type_error"), i)
                parsed.push(new leaf.node(section[0], args.value))
            }break

            // position, number
            case "put":
            case "pset":{
                const args = parseArgs(section[1])
                if (!args.success) return showError(args, i)
                if (args.value.length !== 2) return showError(Expect.error("invalid_args"), i)
                // position
                if ( leaf.isPosition(args.value[0]) ) return showError(Expect.error("invalid_args"), i)
                // number
                if (args.value[1].pottype !== "number" && args.value[1].pottype !== "any") return showError(Expect.error("type_error"), i)
                parsed.push(new leaf.node(section[0], args.value))
            }break

            // position, number[, number]
            case "paint":{
                const args = parseArgs(section[1])
                if (!args.success) return showError(args, i)
                if (args.value.length !== 2 && args.value.length !== 3) return showError(Expect.error("invalid_args"), i)
                // position
                if ( leaf.isPosition(args.value[0]) ) return showError(Expect.error("invalid_args"), i)
                // number
                if (args.value[1].pottype !== "number" && args.value[1].pottype !== "any") return showError(Expect.error("type_error"), i)
                // number
                if (args.value.length === 3 && (args.value[2].pottype !== "number" && args.value[2].pottype !== "any")) return showError(Expect.error("type_error"), i)
                parsed.push(new leaf.node(section[0], args.value))
            }break
            
            // position, number, number[, number]
            case "circle":{
                const args = parseArgs(section[1])
                if (!args.success) return showError(args, i)
                if (args.value.length !== 3 && args.value.length !== 4) return showError(Expect.error("invalid_args"), i)
                // position
                if ( leaf.isPosition(args.value[0]) ) return showError(Expect.error("invalid_args"), i)
                // number
                if (args.value.length === 4 && (args.value[3].pottype !== "number" && args.value[3].pottype !== "any")) return showError(Expect.error("type_error"), i)
                parsed.push(new leaf.node(section[0], args.value))
            }break

            // position, number, number, number
            // roll
            case "roll":{
                const args = parseArgs(section[1])
                if (!args.success) return showError(args, i)
                if (args.value.length !== 3) return showError(Expect.error("invalid_args"), i)
                // position
                if ( leaf.isPosition(args.value[0]) ) return showError(Expect.error("invalid_args"), i)
                // number
                if (args.value[1].pottype !== "number" && args.value[1].pottype !== "any") return showError(Expect.error("type_error"), i)
                // number
                if (args.value[2].pottype !== "number" && args.value[2].pottype !== "any") return showError(Expect.error("type_error"), i)
                parsed.push(new leaf.node(section[0], args.value))
            }

            // number, position
            case "show":{
                const args = parseArgs(section[1])
                if (!args.success) return showError(args, i)
                if (args.value.length !== 2) return showError(Expect.error("invalid_args"), i)
                // number
                if (args.value[0].pottype !== "number" && args.value[0].pottype !== "any") return showError(Expect.error("type_error"), i)
                // position
                if ( leaf.isPosition(args.value[1]) ) return showError(Expect.error("invalid_args"), i)
                parsed.push(new leaf.node(section[0], args.value))
            }break


            // number, number
            case "direction":
            case "speed":
            case "distance":
            case "locate":{
                const args = parseArgs(section[1])
                if (!args.success) return showError(args, i)
                if (args.value.length !== 2) return showError(Expect.error("invalid_args"), i)
                // number
                if (args.value[0].pottype !== "number" && args.value[0].pottype !== "any") return showError(Expect.error("type_error"), i)
                // number
                if (args.value[1].pottype !== "number" && args.value[1].pottype !== "any") return showError(Expect.error("type_error"), i)
                parsed.push(new leaf.node(section[0], args.value))
            }break

            // position-position, number[, number]
            // box
            // oval
            case "box":
            case "oval":{
                const args = parseArgs(section[1])
                if (!args.success) return showError(args, i)
                if (args.value.length !== 2 && args.value.length !== 3) return showError(Expect.error("invalid_args"), i)
                // position-position
                if ( !leaf.isBinaryOperation(args.value[0]) || leaf.isPosition(args.value[0].right) || leaf.isPosition(args.value[0].left) ) return showError(Expect.error("invalid_args"), i)
                // number
                if (args.value.length === 3 && (args.value[2].pottype !== "number" && args.value[2].pottype !== "any")) return showError(Expect.error("type_error"), i)
                parsed.push(new leaf.node(section[0], args.value))
            }break

            
            // position-position, number
            // line
            case "line":{
                const args = parseArgs(section[1])
                if (!args.success) return showError(args, i)
                if (args.value.length !== 2) return showError(Expect.error("invalid_args"), i)
                // position-position
                if ( !leaf.isBinaryOperation(args.value[0]) || leaf.isPosition(args.value[0].right) || leaf.isPosition(args.value[0].left) ) return showError(Expect.error("invalid_args"), i)
                // number
                if (args.value[1].pottype !== "number" && args.value[1].pottype !== "any") return showError(Expect.error("type_error"), i)
                parsed.push(new leaf.node(section[0], args.value))
            }break

            // 最後なので波括弧がなくともスコープ切れる
            case "let":
                if (section[1] === "") return showError(Expect.error("invalid_let"), i)
                section[0] = section[1]
            default:
                if (section[0] !== "") {
                    // 代入だけパース
                    const args = parseArgs(section[0])
                    if (!args.success) return showError(args, i)
                    if ( args.value.length !== 1 || !leaf.isBinaryOperation(args.value[0]) || args.value[0].operation !== "=" || !leaf.isSubstitutable(args.value[0].left) )
                        return showError(Expect.error("expected_substitution"), i)
                    parsed.push(new leaf.node("let", args.value))
                }
            break
        }
    }
}
