
import ts from "typescript"
import { Node } from "./Node"
import { InterchangeableNode } from "./InterchangeableNode"
import { NewlineNode } from "./NewlineNode"
import { cacheFn } from "./cacheFn"
import { PositionalNode } from "./PositionalNode"
import { SpaceNode } from "./SpaceNode"
import { IndentNode } from "./IndentNode"
import { inspect } from "./utils"
import { ForkNode } from "./ForkNode"

class TsNodeNode extends Node {

  static checkMultiline(node: Node): boolean{
    return false
      || node instanceof TsNodeNode && node.isMultiline
      || node instanceof NewlineNode
      || node.children.some(TsNodeNode.checkMultiline)
  }

  isMultiline = TsNodeNode.checkMultiline(this)

  override filter(referenceNodes: readonly this[]){
    return referenceNodes.filter(x => x.isMultiline === this.isMultiline)
  }

}

const nodeClassForSyntaxKind = cacheFn(
  (kind: ts.SyntaxKind): typeof Node => {
    const name = syntaxKindName(kind)
    let priority = 0
    if(kind >= ts.SyntaxKind.FirstPunctuation && kind <= ts.SyntaxKind.LastPunctuation)
      priority = 1

    class BaseClass extends TsNodeNode {

      override priority = priority

    }

    return { [name]: class extends BaseClass {} }[name]
  },
  new Map<ts.SyntaxKind, typeof Node>(),
)

const SyntaxListNode = nodeClassForSyntaxKind(ts.SyntaxKind.SyntaxList)
class SyntaxListEntryNode extends Node {

  constructor(public final: boolean, children: readonly Node[]){
    super(children)
  }

  override filterIsOptional = false
  override filter(nodes: readonly this[]){
    return nodes.filter(x => x.final === this.final)
  }

}

class SwappableArrowFunctionBody extends ForkNode {}

class EmptyNode extends Node {}

class WhitespaceNode extends InterchangeableNode {

  multiline = this.children.some(x => x instanceof NewlineNode)

  override filter(nodes: readonly this[]){
    return nodes.filter(x => x.multiline === this.multiline)
  }

}

const syntaxListConfig: Partial<Record<ts.SyntaxKind, [
  sparse: 0 | 1,
  trailing: 0 | 1,
  optionalSeparator: 0 | 1,
  separatorKind: ts.SyntaxKind
]>> = {
  [ts.SyntaxKind.SourceFile]: [0, 1, 1, ts.SyntaxKind.SemicolonToken],
  [ts.SyntaxKind.Block]: [0, 1, 1, ts.SyntaxKind.SemicolonToken],
  [ts.SyntaxKind.VariableDeclarationList]: [0, 0, 0, ts.SyntaxKind.CommaToken],
  [ts.SyntaxKind.ArrayLiteralExpression]: [1, 1, 0, ts.SyntaxKind.CommaToken],
  [ts.SyntaxKind.ObjectLiteralExpression]: [0, 1, 0, ts.SyntaxKind.CommaToken],
  [ts.SyntaxKind.CallExpression]: [0, 1, 0, ts.SyntaxKind.CommaToken],
  [ts.SyntaxKind.ArrowFunction]: [0, 1, 0, ts.SyntaxKind.CommaToken],
}

export function parseTsSourceFile(sourceFile: ts.SourceFile){
  const source = sourceFile.getFullText()
  let indentLevel = 0
  return parseTsNode(sourceFile)

  function parseTsNode(tsNode: ts.Node): Node{
    const tsChildren = getTsChildren(tsNode)
    const tsNodeStart = tsNode === sourceFile ? tsNode.getFullStart() : tsNode.getStart(sourceFile)
    const text = source.slice(tsNodeStart, tsNode.end)
    if(tsNode.kind === ts.SyntaxKind.SyntaxList)
      return parseTsSyntaxList(tsNode as ts.SyntaxList)
    const NodeClass = nodeClassForSyntaxKind(tsNode.kind)
    if(!tsChildren.length)
      return new NodeClass(text)
    let children = []
    let lastPos = tsNodeStart
    for(const child of tsChildren) {
      if(children.length)
        children.push(parseTrivia(lastPos, child.getStart(sourceFile)))
      lastPos = child.end
      children.push(parseTsNode(child))
    }
    finishTrivia(children)
    if(tsNode.kind === ts.SyntaxKind.ArrowFunction) {
      const bodyNode = children[8]
      const isBlock = bodyNode instanceof nodeClassForSyntaxKind(ts.SyntaxKind.Block)
      const swappable = !isBlock || (
        bodyNode.children[2].children.length === 1
        && bodyNode.children[2].children[0].children[0] instanceof nodeClassForSyntaxKind(ts.SyntaxKind.ReturnStatement)
      )
      if(swappable) {
        const resultNode = isBlock
          ? bodyNode.children[2].children[0].children[0].children[2]
          : bodyNode
        const space = () => new PositionalNode(new WhitespaceNode([new SpaceNode(1)]))
        const alternative = isBlock
          ? resultNode
          : new (nodeClassForSyntaxKind(ts.SyntaxKind.Block))([
            new (nodeClassForSyntaxKind(ts.SyntaxKind.OpenBraceToken))("{"),
            space(),
            new SyntaxListNode([
              new SyntaxListEntryNode(true, [
                new (nodeClassForSyntaxKind(ts.SyntaxKind.ReturnStatement))([
                  new (nodeClassForSyntaxKind(ts.SyntaxKind.ReturnKeyword))("return"),
                  space(),
                  resultNode,
                  new IndentNode(0),
                ]),
                emptyTrivia(),
                new EmptyNode(),
                emptyTrivia(),
                new IndentNode(0),
              ]),
            ]),
            space(),
            new (nodeClassForSyntaxKind(ts.SyntaxKind.OpenBraceToken))("}"),
            new IndentNode(0),
          ])
        children[8] = new SwappableArrowFunctionBody(bodyNode, [alternative])
      }
    }
    return new NodeClass(children)
  }

  function parseTsSyntaxList(tsNode: ts.SyntaxList){
    const config = syntaxListConfig[tsNode.parent.kind]
    if(!config) throw new Error("Unhandled SyntaxList parent " + syntaxKindName(tsNode.parent.kind))
    const [sparse, trailing, optionalSeparator, separatorKind] = config
    const children = tsNode.getChildren()
    let nodes = []
    for(let i = 0; i < children.length; i++) {
      const child = children[i]
      const nextChild = children[i + 1] as ts.Node | undefined
      if(child.kind === separatorKind) {
        if(!sparse)
          throw new Error(`Encountered double separator in ${syntaxKindName(tsNode.parent.kind)} SyntaxList`)
        nodes.push(new SyntaxListEntryNode(!nextChild, finishTrivia([
          new EmptyNode(),
          emptyTrivia(),
          new PositionalNode(parseTsNode(child)),
          parseTriviaBetween(child, nextChild),
        ])))
        continue
      }
      if(nextChild?.kind !== separatorKind) {
        if(nextChild && !optionalSeparator)
          throw new Error(`Encountered missing separator in ${syntaxKindName(tsNode.parent.kind)} SyntaxList`)
        nodes.push(new SyntaxListEntryNode(!nextChild, finishTrivia([
          parseTsNode(child),
          parseTriviaBetween(child, nextChild),
          new EmptyNode(),
          emptyTrivia(),
        ])))
        continue
      }
      if(nextChild && i === children.length - 2 && !trailing)
        throw new Error(`Encountered trailing separator in ${syntaxKindName(tsNode.parent.kind)} SyntaxList`)
      const nextNextChild = children[i + 2] as ts.Node | undefined
      nodes.push(new SyntaxListEntryNode(!nextNextChild, finishTrivia([
        new PositionalNode(parseTsNode(child)),
        parseTriviaBetween(child, nextChild),
        new PositionalNode(parseTsNode(nextChild)),
        parseTriviaBetween(nextChild, nextNextChild),
      ])))
      i++
    }
    return new SyntaxListNode(nodes)
  }

  function getTsChildren(node: ts.Node){
    return node.getChildren(sourceFile)
  }

  function parseTriviaBetween(a?: ts.Node, b?: ts.Node){
    if(!a || !b) return emptyTrivia()
    return parseTrivia(a.end, b.getStart(sourceFile))
  }

  function emptyTrivia(){
    return new PositionalNode(new WhitespaceNode([]))
  }

  function finishTrivia(children: Node[]){
    let deltaIndent = 0
    for(const child of children)
      if(child instanceof PositionalNode)
        if(child.children[0] instanceof WhitespaceNode)
          for(const node of child.children[0].children)
            if(node instanceof NewlineNode)
              deltaIndent += node.deltaIndent
    children.push(new IndentNode(-deltaIndent))
    indentLevel -= deltaIndent
    return children
  }

  function parseTrivia(start: number, end: number){
    const text = source.slice(start, end)
    let children = []
    const regex = /^ +|^\n *|^\/\/.*|^\/\*[^]*\*\//
    let ind = 0
    while(ind < text.length) {
      const [match] = text.slice(ind).match(regex) ?? [null]
      if(!match) throw new Error("Encountered invalid trivia")
      ind += match.length
      if(match[0] === " ")
        children.push(new SpaceNode(match.length))
      else if(match[0] === "\n") {
        const deltaIndent = Math.floor((match.length - 1) / 2) - indentLevel
        indentLevel += deltaIndent
        children.push(new NewlineNode(deltaIndent))
      }
      // else children.push(new TextNode(match))
    }
    return new PositionalNode(new WhitespaceNode(children))
  }
}

export function printTsNode(sourceFile: ts.SourceFile, node: ts.Node = sourceFile, indent = 0){
  const children = node.getChildren(sourceFile)
  const start = node.getStart(sourceFile)
  const end = node.end
  const text = node.getText(sourceFile)
  console.log(
    "| ".repeat(indent) + syntaxKindName(node.kind),
    `${inspect(start)}-${inspect(end)}`,
    (children.length ? "{" : inspect(text) + ","),
  )
  for(const child of children) printTsNode(sourceFile, child, indent + 1)
  if(children.length) console.log("| ".repeat(indent) + "},")
}

function syntaxKindName(kind: ts.SyntaxKind){
  for(const name in ts.SyntaxKind)
    if(ts.SyntaxKind[name] as never === kind)
      return name
  throw new Error("Unknown ts.SyntaxKind " + kind)
}
