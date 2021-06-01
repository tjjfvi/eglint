
import ts from "typescript"
import { readFileSync } from "fs"
import { Node } from "./Node"
import { GroupNode } from "./GroupNode"

const file = (path: string) => readFileSync(require.resolve(path), "utf8")

const rules = ts.createSourceFile("rules", file("../test/eglintRules.ts"), ts.ScriptTarget.ES2020)

class TextNode extends Node {

  constructor(public text: string){
    super()
  }

  toString(){
    return this.text
  }

}

function parseTsSourceFile(sourceFile: ts.SourceFile){
  const source = sourceFile.getFullText()
  const indentDeltas = new Map<number, number>()
  let curPos = 0
  let indentLevel = 0
  for(const line of source.split("\n")) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const indents = Math.ceil(line.match(/^ */)![0].length / 2)
    const indentDelta = indents - indentLevel
    indentDeltas.set(curPos, indentDelta)
    indentLevel = indents
    curPos += line.length + 1
  }
  return parseTsNode(sourceFile)

  function parseTsNode(tsNode: ts.Node, indent = 0): Node{
    const children = getTsChildren(tsNode)
    const tsNodeStart = tsNode === sourceFile ? tsNode.getFullStart() : tsNode.getStart(sourceFile)
    if(!children.length) {
      if(!isExpressionNode({ ...tsNode, ...{ parent: tsNode.parent ?? {} } }))
        console.log(ts.SyntaxKind[tsNode.kind])
      return new TextNode(source.slice(tsNodeStart, tsNode.end))
    }
    let nodes = []
    let lastPos = tsNodeStart
    for(const child of children) {
      nodes.push(parseTrivia(lastPos, child.getStart(sourceFile)))
      lastPos = child.end
      nodes.push(parseTsNode(child, indent + 1))
    }
    nodes.push(parseTrivia(lastPos, tsNode.end))
    return new GroupNode(nodes)
  }

  function getTsChildren(node: ts.Node){
    return node.getChildren(sourceFile)
  }

  function parseTrivia(start: number, end: number){
    const text = source.slice(start, end)
    text
    return new TextNode(text)
  }
}

function printTsNode(sourceFile: ts.SourceFile, node: ts.Node = sourceFile, indent = 0){
  let type
  for(type in ts.SyntaxKind) if(ts.SyntaxKind[type] as never === node.kind) break
  const children = node.getChildren(sourceFile)
  console.log("  ".repeat(indent) + type + (children.length ? " {" : ","))
  for(const child of children) printTsNode(sourceFile, child, indent + 1)
  if(children.length) console.log("  ".repeat(indent) + "},")
}

const isExpressionNode = (ts as any).isExpressionNode as (node: ts.Node) => boolean

printTsNode(rules)
console.log(parseTsSourceFile(rules))
