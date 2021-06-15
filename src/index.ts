
import { readFileSync } from "fs"
import ts from "typescript"
import { parseTsSourceFile, printTsNode } from "./ts"

const file = (path: string) => readFileSync(path, "utf8")

const referenceTsNode = ts.createSourceFile("reference", file(process.argv[2]), ts.ScriptTarget.ES2020, true)
const sourceTsNode = ts.createSourceFile("reference", file(process.argv[3]), ts.ScriptTarget.ES2020, true)

printTsNode(referenceTsNode)
printTsNode(sourceTsNode)

const referenceNode = parseTsSourceFile(referenceTsNode)
const sourceNode = parseTsSourceFile(sourceTsNode)

console.log(referenceNode.toDebugString())
console.log(sourceNode.toDebugString())

const outputNode = sourceNode.adaptTo([], referenceNode.getAllNodes())

console.log(outputNode.toDebugString())

console.log("\n// output")
console.log(outputNode.toString())
