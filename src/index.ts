
import ts from "typescript"
import { readFileSync } from "fs"
import { Node } from "./Node"
import { Context, ContextProvider } from "./Context"
import { inspect } from "util"
import { Criterion, DataCriterion, PresenceCriterion } from "./Criterion"

const $isExpression = new DataCriterion<boolean>()
const $kind = new DataCriterion<ts.SyntaxKind | string>()

const $whitespace = new PresenceCriterion((_, reference) => reference)
const $newline = new DataCriterion<number>((_, reference) => reference)
const $punctuation = new DataCriterion<string>()
const $keyword = new DataCriterion<string>()

const criterionNameLookup = {
  $isExpression,
  $kind,
  $whitespace,
  $newline,
  $punctuation,
  $keyword,
}

const file = (path: string) => readFileSync(require.resolve(path), "utf8")

let x = new Set()
const syntaxListConfig: Partial<Record<ts.SyntaxKind, [
  sparse: 0 | 1,
  trailing: 0 | 1,
  optionalSeparator: 0 | 1,
  separatorKind: ts.SyntaxKind
]>> = {
  [ts.SyntaxKind.SourceFile]: [0, 1, 1, ts.SyntaxKind.SemicolonToken],
  [ts.SyntaxKind.VariableDeclarationList]: [0, 0, 0, ts.SyntaxKind.CommaToken],
  [ts.SyntaxKind.ArrayLiteralExpression]: [1, 1, 0, ts.SyntaxKind.CommaToken],
  [ts.SyntaxKind.ObjectLiteralExpression]: [0, 1, 0, ts.SyntaxKind.CommaToken],
}
syntaxListConfig
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

  function parseTsNode(tsNode: ts.Node): Node{
    const tsChildren = getTsChildren(tsNode)
    const tsNodeStart = tsNode === sourceFile ? tsNode.getFullStart() : tsNode.getStart(sourceFile)
    const text = source.slice(tsNodeStart, tsNode.end)
    if(tsNode.kind === ts.SyntaxKind.EndOfFileToken)
      return new Node()
    if(tsNode.kind >= ts.SyntaxKind.FirstPunctuation && tsNode.kind <= ts.SyntaxKind.LastPunctuation)
      return new Node({ text, criteria: [$punctuation.for(text)] })
    if(tsNode.kind >= ts.SyntaxKind.FirstKeyword && tsNode.kind <= ts.SyntaxKind.LastKeyword)
      return new Node({ text, criteria: [$keyword.for(text)] })
    const criteria = [$isExpression.for(isExpressionNode(tsNode)), $kind.for(tsNode.kind)]
    if(tsNode.kind === ts.SyntaxKind.SyntaxList)
      return parseTsSyntaxList(tsNode as ts.SyntaxList, criteria)
    if(!tsChildren.length)
      return new Node({ text, criteria })
    let children = []
    let lastPos = tsNodeStart
    for(const child of tsChildren) {
      children.push(parseTrivia(lastPos, child.getStart(sourceFile)))
      lastPos = child.end
      children.push(parseTsNode(child))
    }
    return new Node({ children, criteria })
  }

  function parseTsSyntaxList(tsNode: ts.SyntaxList, criteria: readonly Criterion[]){
    const config = syntaxListConfig[tsNode.parent.kind]
    if(!config) throw new Error("Unhandled SyntaxList parent " + syntaxKind(tsNode.parent.kind))
    const [sparse, trailing, optionalSeparator, separatorKind] = config
    const children = tsNode.getChildren()
    let nodes = []
    for(let i = 0; i < children.length; i++) {
      const child = children[i]
      const nextChild = children[i + 1] as ts.Node | undefined
      if(child.kind === separatorKind) {
        if(!sparse)
          throw new Error(`Encountered double separator in ${syntaxKind(tsNode.parent.kind)} SyntaxList`)
        nodes.push(new Node({
          children: [
            new Node(),
            emptyTrivia(),
            parseTsNode(child),
            parseTriviaBetween(child, nextChild),
          ],
        }))
        continue
      }
      if(nextChild?.kind !== separatorKind) {
        if(nextChild && !optionalSeparator)
          throw new Error(`Encountered missing separator in ${syntaxKind(tsNode.parent.kind)} SyntaxList`)
        nodes.push(new Node({
          children: [
            parseTsNode(child),
            parseTriviaBetween(child, nextChild),
            new Node(),
            emptyTrivia(),
          ],
        }))
        continue
      }
      if(nextChild && i === children.length - 2 && !trailing)
        throw new Error(`Encountered trailing separator in ${syntaxKind(tsNode.parent.kind)} SyntaxList`)
      const nextNextChild = children[i + 2] as ts.Node | undefined
      nodes.push(new Node({
        children: [
          parseTsNode(child),
          parseTriviaBetween(child, nextChild),
          parseTsNode(nextChild),
          parseTriviaBetween(nextChild, nextNextChild),
        ],
      }))
      i++
    }
    return new Node({ children: nodes, criteria })
  }

  function getTsChildren(node: ts.Node){
    return node.getChildren(sourceFile)
  }

  function parseTriviaBetween(a?: ts.Node, b?: ts.Node){
    if(!a || !b) return emptyTrivia()
    return parseTrivia(a.end, b.getStart(sourceFile))
  }

  function emptyTrivia(){
    return new Node()
  }

  function parseTrivia(start: number, end: number){
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
        children.push(new Node({ text: match }))
      else if(match[0] === "\n") {
        const deltaIndent = indentDeltas.get(start + curInd + 1)
        if(deltaIndent === undefined) throw new Error("Invalid state")
        children.push(newlineNode(deltaIndent))
      }
      // else children.push(new TextNode(match))
    }
    return new Node({ children, criteria: [$whitespace] })
  }

  function newlineNode(deltaIndent: number){
    return new Node({
      text: contextProvider => {
        const indentation = contextProvider.getContext(IndentationContext)
        indentation.level += deltaIndent
        return "\n" + indentation
      },
      criteria: [$newline.for(deltaIndent)],
    })
  }
}

class IndentationContext extends Context {

  level = 0

  override toString(){
    if(this.level < 0)
      return "!!".repeat(-this.level)
    return "  ".repeat(this.level)
  }

}

export function printTsNode(sourceFile: ts.SourceFile, node: ts.Node = sourceFile, indent = 0){
  const children = node.getChildren(sourceFile)
  const start = node.getStart(sourceFile)
  const end = node.end
  const text = node.getText(sourceFile)
  console.log(
    "| ".repeat(indent) + syntaxKind(node.kind),
    `${i(start)}-${i(end)}`,
    (children.length ? "{" : i(text) + ","),
  )
  for(const child of children) printTsNode(sourceFile, child, indent + 1)
  if(children.length) console.log("| ".repeat(indent) + "},")
}

export function printNode(node: Node, contextProvider = new ContextProvider()){
  let acc = ""
  acc += "Node"
  if(!node.children.length)
    acc += " " + i(node.toString(contextProvider))
  if(node.children.length)
    acc += " {"
  if(node.criteria.length) {
    let obj: Record<string, unknown> = {}
    for(let criterion of node.criteria) {
      if(criterion instanceof DataCriterion && "apply" in criterion)
        criterion = Object.getPrototypeOf(criterion)
      const criterionName =
        Object.entries(criterionNameLookup).find(x => x[1] === criterion)?.[0].slice(1) ?? criterion.constructor.name
      if(node.children.length)
        acc += "\n  " + criterionName + ": " + i(criterion.classify(node))
      else
        obj[criterionName] = criterion.classify(node)
    }
    if(!node.children.length)
      acc += " " + i(obj)
  }
  if(node.children.length) {
    for(const child of node.children)
      acc += "\n" + printNode(child, contextProvider).replace(/^/gm, "  ")
    acc += "\n}"
  }
  return acc
}

const isExpressionNode = (ts as any).isExpressionNode as (node: ts.Node) => boolean

function i(source: unknown){
  return inspect(source, { depth: null, colors: true })
}

function syntaxKind(kind: ts.SyntaxKind){
  for(const name in ts.SyntaxKind)
    if(ts.SyntaxKind[name] as never === kind)
      return name
  return "<?>"
}

const referenceTsNode = ts.createSourceFile("reference", file("../test/reference.ts"), ts.ScriptTarget.ES2020, true)
const referenceNode = parseTsSourceFile(referenceTsNode)
const sourceTsNode = ts.createSourceFile("reference", file("../test/source.ts"), ts.ScriptTarget.ES2020, true)
const sourceNode = parseTsSourceFile(sourceTsNode)

// const sourceNode =
//   new ListNode([
//     new GroupNode([new TextNode("b"), new WhitespaceNode([new TextNode("! ")])]),
//     new GroupNode([new TextNode("a"), new WhitespaceNode([new TextNode("! ")])]),
//     new GroupNode([new TextNode("c"), new WhitespaceNode([new TextNode("! ")])]),
//     new GroupNode([new TextNode("d"), new WhitespaceNode([new TextNode("! ")])]),
//     new GroupNode([new TextNode("a"), new WhitespaceNode([new TextNode("! ")])]),
//   ])
// const referenceNode =
//   new ListNode([
//     new GroupNode([new TextNode("a"), new WhitespaceNode([new TextNode("A ")])]),
//     new GroupNode([new TextNode("b"), new WhitespaceNode([new TextNode("B ")])]),
//     new GroupNode([new TextNode("c"), new WhitespaceNode([new TextNode("B ")])]),
//   ])

const outputNode = referenceNode.adaptTo(referenceNode.getAllNodes())

console.log(printTsNode(referenceTsNode))
console.log(printNode(referenceNode))

console.log(
  outputNode
  // (sourceNode.adaptTo(reference, referenceNode) ?? sourceNode)
    .toString(new ContextProvider()),
)

