import { potValue } from "./leaves";
import { Expect } from "./libs/expect";
import { isDecimalNumber, splitFirst } from "./libs/miscs";
import { data } from "./libs/shared";

// dataは逆順なので注意
export function jasmineDataPicker(text: string): Expect<Array<potValue>> {
    const br = /\r\n|\n|\r/g
    text.split(br)
        .forEach(line=>{
            const section = splitFirst(line.trimStart(), " ")
            if ( section[0] === "data" )
                line.split(",")
                    .forEach(dataPile=>{
                        dataPile = dataPile.trim()
                        if (dataPile === "") return Expect.error("empty_data")
                        if (dataPile.includes(":")) return Expect.error("data_:")
                        if (isDecimalNumber(dataPile)){
                            data.unshift(parseFloat(dataPile))
                        } else {
                            data.unshift(dataPile)
                        }
                    })
        })

    return Expect.result(data)
}
