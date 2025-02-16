import { splitFirst } from "./libs"

export function jasmineTranspiler(text: string): string {

    const lines = text.split("\n")
    const vars = []
    const data = []
    const pics = []
    const backgrounds = []

    function parseCoordinate() {
    
    }
    
    function parseString(string) {
        
    }

    function parseNumber(text: string): number {
        
        return parseInt(text);
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trimStart()
        const section = splitFirst(line, " ")
        const args = section[1]
        switch (section[0]) {
            case "print":
                console.log(parseString(args))
                break;
            case "let":
                // console.log(parseString(args))
                break;
            case "def":
                
                break;
        
            default:
                break;
        }
    }
}
