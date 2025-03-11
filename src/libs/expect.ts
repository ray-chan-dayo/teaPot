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
    index : number
    constructor(errMsg: string, index: number) {
        this.message = errMsg
        this.index = index
    }    
}

const Expect = {
    result: <T>(value: T) => new Success<T>(value),
    error: (errMsg: string, lineNo: number = -1) => new PotError(errMsg, lineNo),
    isError: (e:Expect<any>):e is PotError => !e.success
}

export { Expect }
