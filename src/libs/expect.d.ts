type Expect<T> = Success<T> | PotError

class Success<T> {
    success: true
    value: T
    constructor(value) {
        this.success = true
        this.value = value
    }
}

class PotError {
    success: false
    message: string
    constructor(errMsg) {
        this.success = false
        this.message = errMsg
    }    
}

const Expect = {
    result: <T>(value: T) => new Success<T>(value),
    error: (errMsg: string) => new PotError(errMsg)
}

export { Expect }
