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
        const section = splitFirst(line, " ")
        switch (section[0]) {
            case "do": {
                doCount++
            }break
            case "loop": {
                doCount--
            }break
            case "for": {
                forCount++
            }break
            case "next": {
                forCount--
            }break
            case "if": {
                ifCount++
            }break
            case "end": {
                if (section[1] === "if") ifCount--
                else if (section[1] === "function") {
                    functionCount--
                    if (doCount !== 0 || forCount !== 0 || ifCount !== 0 || functionCount !== 0 || procedureCount !== 0) return showError(Expect.error("no_end"), i)
                }
                else if (section[1] === "procedure") {
                    procedureCount--
                    if (doCount !== 0 || forCount !== 0 || ifCount !== 0 || functionCount !== 0 || procedureCount !== 0) return showError(Expect.error("no_end"), i)
                }
                else if (section[1] === "") {
                    if (doCount !== 0 || forCount !== 0 || ifCount !== 0 || functionCount !== 0 || procedureCount !== 0) return showError(Expect.error("no_end"), i)
                    return // endなのでここで終了
                } else {
                    return showError(Expect.error("invalid_end"), i)
                }
            }break
            case "function": {
                const funcArgs = parseArgs(section[1])
                if (doCount !== 0 || forCount !== 0 || ifCount !== 0 || functionCount !== 0 || procedureCount !== 0) return showError(Expect.error("invalid_function_declear_placement"), i)
                if (!funcArgs.success) return showError(funcArgs, i)
                if (funcArgs.value.length !== 1 || !leaf.isFunc(funcArgs.value[0])) return showError(Expect.error("invalid_args"), i)
                // ここに予約語のチェックを入れる
                functions[funcArgs.value[0].name] = i
                functionCount++
            }break
            case "procedure": {
                const procArgs = parseArgs(section[1])
                if (doCount !== 0 || forCount !== 0 || ifCount !== 0 || functionCount !== 0 || procedureCount !== 0) return showError(Expect.error("invalid_procedure_declear_placement"), i)
                if (!procArgs.success) return showError(procArgs, i)
                if (procArgs.value.length !== 1 || !leaf.isFunc(procArgs.value[0])) return showError(Expect.error("invalid_args"), i)
                // ここに予約語のチェックを入れる
                procedures[procArgs.value[0].name] = i
                procedureCount++
            }break
        }
    }
}
