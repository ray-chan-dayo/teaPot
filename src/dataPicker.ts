import { isDecimalNumber, splitFirst } from "./libs";

export function jasmineDataPicker(text: string) {
    const br = /\r\n|\n|\r/g
    const data:Array<Number|string> = []

    text.split(br)
        .forEach(line=>{
            const section = splitFirst(line.trimStart(), " ")
            if ( section[0] === "data" )
                line.split(",")
                    .forEach(dataPile=>{
                        dataPile = dataPile.trimStart()
                        if (isDecimalNumber(dataPile)){
                            data.push(parseFloat(dataPile))
                        } else {
                            data.push(dataPile)
                        }
                    })
        })

    return data
}
