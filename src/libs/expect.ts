type Expect<T> = Success<T> | PotError

class Success<T> {
    success: true = true
    value: T
    constructor(value: T) {
        this.value = value
    }
}

class PotError {
    success: false = false
    message: string
    line : number
    constructor(errMsg: string, lineNo: number) {
        this.message = errMsg
        this.line = lineNo
    }    
}

const Expect = {
    result: <T>(value: T) => new Success<T>(value),
    error: (errMsg: string, lineNo: number = -1) => new PotError(errMsg, lineNo),
    isError: (e:Expect<any>):e is PotError => !e.success
}

export { Expect }
