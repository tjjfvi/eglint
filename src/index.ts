
import { readFileSync } from "fs"
import ts from "typescript"
import { parseTsSourceFile, printTsNode } from "./ts"

const file = (path: string) => readFileSync(require.resolve(path), "utf8")

const referenceTsNode = ts.createSourceFile("reference", file("../test/reference"), ts.ScriptTarget.ES2020, true)
const sourceTsNode = ts.createSourceFile("reference", file("../test/source"), ts.ScriptTarget.ES2020, true)

printTsNode(referenceTsNode)
printTsNode(sourceTsNode)

const referenceNode = parseTsSourceFile(referenceTsNode, false)
const sourceNode = parseTsSourceFile(sourceTsNode, true)

console.log(referenceNode.toDebugString())
console.log(sourceNode.toDebugString())

const outputNode = sourceNode.adaptTo([], referenceNode.getAllNodes())

console.log(outputNode.toDebugString())

console.log("\n// output")
console.log(outputNode.toString())
