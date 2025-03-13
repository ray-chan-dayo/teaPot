import { isDecimalNumber, splitFirst } from "./libs/miscs";

// dataは逆順なので注意
export function jasmineDataPicker(text: string) {
    const br = /\r\n|\n|\r/g
    const data:Array<number|string> = []

    text.split(br)
        .forEach(line=>{
            const section = splitFirst(line.trimStart(), " ")
            if ( section[0] === "data" )
                line.split(",")
                    .forEach(dataPile=>{
                        dataPile = dataPile.trimStart()
                        if (isDecimalNumber(dataPile)){
                            data.unshift(parseFloat(dataPile))
                        } else {
                            data.unshift(dataPile)
                        }
                    })
        })

    return data
}
