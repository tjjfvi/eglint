
import ts from "typescript"
import { readFileSync } from "fs"
import { Node } from "./Node"
import { GroupNode } from "./GroupNode"
import { SpaceNode } from "./SpaceNode"
import { NewlineNode } from "./NewlineNode"
import { WhitespaceNode } from "./WhitespaceNode"
import { ContextProvider } from "./Context"
import { inspect } from "util"

const file = (path: string) => readFileSync(require.resolve(path), "utf8")

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

  function parseTsNode(tsNode: ts.Node, parent?: ts.Node): Node{
    const children = getTsChildren(tsNode)
    const tsNodeStart = tsNode === sourceFile ? tsNode.getFullStart() : tsNode.getStart(sourceFile)
    if(!children.length) {
      if(!isExpressionNode({ ...tsNode, parent: parent ?? tsNode.parent }))
        console.log(ts.SyntaxKind[tsNode.kind])
      return new TextNode(source.slice(tsNodeStart, tsNode.end))
    }
    let nodes = []
    let lastPos = tsNodeStart
    for(const child of children) {
      nodes.push(parseTrivia(lastPos, child.getStart(sourceFile)))
      lastPos = child.end
      nodes.push(parseTsNode(child, tsNode))
    }
    return new GroupNode(nodes)
  }

  function getTsChildren(node: ts.Node){
    return node.getChildren(sourceFile)
  }

  function parseTrivia(start: number, end: number){
    console.log(start, end)
    const text = source.slice(start, end)
    let children = []
    const regex = /^ +|^\n *|^\/\/.*|^\/\*[^]*\*\//
    let ind = 0
    while(ind < text.length) {
      const [match] = text.slice(ind).match(regex) ?? [null]
      if(!match) throw new Error("Encountered invalid trivia")
      const curInd = ind
      ind += match.length
      if(match[0] === " ")
        children.push(new SpaceNode(match.length))
      else if(match[0] === "\n") {
        const deltaIndent = indentDeltas.get(start + curInd + 1)
        if(deltaIndent === undefined) throw new Error("Invalid state")
        children.push(new NewlineNode(deltaIndent))
      }
      else children.push(new TextNode(match))
    }
    return new WhitespaceNode(children)
  }
}

export function printTsNode(sourceFile: ts.SourceFile, node: ts.Node = sourceFile, indent = 0){
  let type
  for(type in ts.SyntaxKind) if(ts.SyntaxKind[type] as never === node.kind) break
  const children = node.getChildren(sourceFile)
  const start = node.getStart(sourceFile)
  const end = node.end
  const text = node.getText(sourceFile)
  console.log(" ".repeat(indent) + type, `${i(start)}-${i(end)}`, (children.length ? "{" : i(text) + ","))
  for(const child of children) printTsNode(sourceFile, child, indent + 1)
  if(children.length) console.log(" ".repeat(indent) + "},")
}

const isExpressionNode = (ts as any).isExpressionNode as (node: ts.Node) => boolean

const referenceTsNode = ts.createSourceFile("reference", file("../test/reference.ts"), ts.ScriptTarget.ES2020)
const reference = parseTsSourceFile(referenceTsNode)
const sourceTsNode = ts.createSourceFile("reference", file("../test/source.ts"), ts.ScriptTarget.ES2020)
const source = parseTsSourceFile(sourceTsNode)

console.log(printTsNode(sourceTsNode))
// console.log(inspect(source, { depth: null, colors: true }))

console.log(
  source
    .adaptTo(reference)
    .toString(new ContextProvider()),
)

function i(source: unknown){
  return inspect(source, { depth: null, colors: true })
}
