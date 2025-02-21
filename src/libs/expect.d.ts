type Expect<T> = Success<T> | PotError

class Success<T> {
    success: true = true
    value: T
    constructor(value) {
        this.value = value
    }
}

class PotError {
    success: false = false
    message: string
    constructor(errMsg) {
        this.message = errMsg
    }    
}

const Expect = {
    result: <T>(value: T) => new Success<T>(value),
    error: (errMsg: string) => new PotError(errMsg)
}

export { Expect }
