import { Expect } from "./libs/expect";

export function showError(error: Expect<any>, line: number): any {
    if (error.success)
        return showError(Expect.error("internal_error"), -1)
    console.error(`error at line ${line}: ${}`)
}