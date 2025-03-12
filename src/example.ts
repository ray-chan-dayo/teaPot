import { readFileSync } from "fs";
import { jasmineInterPreter } from "./interPreter";

// テキストファイルを読み込む関数
function readTextFile(filePath: string): string {
    return readFileSync(filePath, "utf8");
}

// 読み込んだテキストを処理する関数
function processText(text: string): void {
    console.log("ファイルの内容:", jasmineInterPreter(text));
}

// 使用例
const filePath = "test2.jasmine"; // 読み込むファイルのパス
const fileContent = readTextFile(filePath);
processText(fileContent);
