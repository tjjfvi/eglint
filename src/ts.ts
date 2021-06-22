
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
import { FilterGroup } from "./FilterGroup"
import { SingletonNode } from "./SingletonNode"
import { RelativePositionalNode } from "./RelativePositionalNode"

class TsNodeNode extends Node {

  static checkMultiline(node: Node): boolean{
    return false
      || node instanceof TsNodeNode && node.isMultiline
      || node instanceof NewlineNode
      || node.children.some(TsNodeNode.checkMultiline)
  }

  isMultiline = TsNodeNode.checkMultiline(this)

  multilineFilter = this.filterGroup.addFilter({
    priority: .5,
    filter(self, nodes){
      return nodes.filter(x => x.isMultiline === self.isMultiline)
    },
  })

}

const nodeClassForSyntaxKind = cacheFn(
  (kind: ts.SyntaxKind): typeof TsNodeNode => {
    const name = syntaxKindName(kind)
    let priority = 1
    if(kind >= ts.SyntaxKind.FirstPunctuation && kind <= ts.SyntaxKind.LastPunctuation)
      priority = 2

    class BaseClass extends TsNodeNode {

      override get priority(){
        return priority
      }

    }

    return { [name]: class extends BaseClass {} }[name]
  },
  new Map<ts.SyntaxKind, typeof TsNodeNode>(),
)

class SyntaxListNode extends TsNodeNode {

  constructor(children: readonly Node[]){
    super(children)
  }

  isEmptyFilter = this.filterGroup.addFilter({
    required: "strong",
    filter(self, nodes){
      return nodes.filter(x => !!x.children.length === !!self.children.length)
    },
  })

  override get priority(){
    return .4
  }

  override get requireContext(){
    return true
  }

}

class SyntaxListEntryNode extends SingletonNode {

  override get priority(){
    return .9
  }

  override get requireContext(){
    return true
  }

}

class SyntaxListSeparatorNode extends RelativePositionalNode {

  override get requireContext(){
    return true
  }

}

class SwappableArrowFunctionBody extends ForkNode {}

class EmptyNode extends Node {}

class WhitespaceNode extends InterchangeableNode {

  multiline = this.children.some(x => x instanceof NewlineNode)

}

class WhitespacePositionalNode extends PositionalNode {

  override get priority(){
    return -1
  }

}

class OptionalSemiNode extends ForkNode {

  override get requireContext(){
    return true
  }

}

class TrailingCommaNode extends ForkNode {

  override get requireContext(){
    return true
  }

}

enum StringLiteralEscapes {
  Single = 1 << 0,
  Double = 1 << 1,
  Backtick = 1 << 2,
}

class StringLiteralNode extends Node {

  quote = this.text[0]
  innerText = this.text.slice(1, -1)
  escapes = 0
    | (this.innerText.includes("'") ? StringLiteralEscapes.Single : 0)
    | (this.innerText.includes('"') ? StringLiteralEscapes.Double : 0)
    | (this.innerText.includes("`") ? StringLiteralEscapes.Backtick : 0)

  constructor(public text: string){
    super(text)
  }

  stringLiteralFilter = this.filterGroup.addFilter(new FilterGroup({
    mode: "and",
    priority: 10,
    required: "strong",
    filters: [
      new FilterGroup({
        mode: "or",
        required: "weak",
        filters: [
          {
            required: "weak",
            filter(self, nodes){
              return nodes.filter(x => x.escapes === self.escapes)
            },
          },
          {
            filter(self, nodes){
              return nodes.filter(x => (self.escapes & x.escapes) === self.escapes)
            },
          },
        ],
      }),
      {
        filter(self, nodes){
          return nodes.filter(x => x.quote === self.quote)
        },
      },
    ],
  }))

  override _adaptTo(selectedNode: this | null){
    if(!selectedNode || selectedNode.quote === this.quote) return this
    const newQuote = selectedNode.quote
    const escapedInnerText = this.innerText
      // If the length is even (like `\"`), it's already escaped
      .replace(new RegExp("\\\\*" + newQuote, "g"), x => x.length % 2 ? "\\" + x : x)
      // Unescape old quotes; we don't need to check for length, because they must be escaped
      .replace(new RegExp("\\\\" + this.quote, "g"), this.quote)
    return new StringLiteralNode(newQuote + escapedInnerText + newQuote)
  }

}

const asiHazards = new Set("+-*/([`")

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
    if(tsNode.kind === ts.SyntaxKind.StringLiteral || tsNode.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral)
      return new StringLiteralNode(text)
    if(!tsChildren.length)
      return new NodeClass(text)
    let children = []
    let lastPos = tsNodeStart
    for(const child of tsChildren) {
      if(children.length || tsNode === sourceFile)
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
        const space = () => new WhitespacePositionalNode([new WhitespaceNode([new SpaceNode(1)])])
        const alternative = isBlock
          ? resultNode
          : new (nodeClassForSyntaxKind(ts.SyntaxKind.Block))([
            new (nodeClassForSyntaxKind(ts.SyntaxKind.OpenBraceToken))("{"),
            space(),
            new SyntaxListNode([
              new SyntaxListEntryNode(new (nodeClassForSyntaxKind(ts.SyntaxKind.ReturnStatement))([
                new (nodeClassForSyntaxKind(ts.SyntaxKind.ReturnKeyword))("return"),
                space(),
                resultNode,
                new IndentNode(0),
              ])),
              new SyntaxListSeparatorNode([
                emptyTrivia(),
                new OptionalSemiNode(
                  new EmptyNode(),
                  [new (nodeClassForSyntaxKind(ts.SyntaxKind.SemicolonToken))(";")],
                ),
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
    switch(tsNode.parent.kind) {
      case ts.SyntaxKind.VariableDeclarationList:
      case ts.SyntaxKind.ArrayLiteralExpression:
      case ts.SyntaxKind.ObjectLiteralExpression:
      case ts.SyntaxKind.CallExpression:
      case ts.SyntaxKind.ArrowFunction: {
        const children = tsNode.getChildren()
        const nodes = []
        for(const [i, child] of children.entries())
          if(child.kind === ts.SyntaxKind.CommaToken)
            nodes.push(new SyntaxListSeparatorNode(finishTrivia([
              parseTriviaBetween(children[i - 1], child),
              i === children.length - 1
                ? new TrailingCommaNode(parseTsNode(child), [new EmptyNode()])
                : parseTsNode(child),
              parseTriviaBetween(child, children[i + 1]),
            ])))
          else
            nodes.push(new SyntaxListEntryNode(parseTsNode(child)))
        if(children.length && children[children.length - 1].kind !== ts.SyntaxKind.CommaToken)
          nodes.push(new SyntaxListSeparatorNode(finishTrivia([
            emptyTrivia(),
            new TrailingCommaNode(new EmptyNode(), [new (nodeClassForSyntaxKind(ts.SyntaxKind.CommaToken))(",")]),
            emptyTrivia(),
          ])))
        return new SyntaxListNode(nodes)
      }
      /* eslint-disable @typescript-eslint/no-non-null-assertion */
      case ts.SyntaxKind.Block:
      case ts.SyntaxKind.SourceFile: {
        const children = tsNode.getChildren()
        const nodes = []
        for(const [i, child] of children.entries()) {
          const grandchildren = child.getChildren()
          const hasSemicolon = grandchildren[grandchildren.length - 1]?.kind === ts.SyntaxKind.SemicolonToken
          const semicolonTsNode = hasSemicolon ? grandchildren[grandchildren.length - 1] : undefined
          const lastStatementChild = grandchildren[grandchildren.length - (hasSemicolon ? 2 : 1)] as ts.Node | undefined
          const nextChild = children[i + 1] as ts.Node | undefined
          const nextChildFirstChar = nextChild && source.slice(nextChild.getStart(sourceFile)).slice(0, 1)
          const optional = lastStatementChild && (false
            || !hasSemicolon
            || !nextChild
            || true
              && source.slice(lastStatementChild.end, nextChild.getStart(sourceFile)).includes("\n")
              && !asiHazards.has(nextChildFirstChar!)
          )
          const stmtNode = parseTsNode(child)
          if(hasSemicolon)
            (stmtNode.children as Node[]).splice(stmtNode.children.length - 3, 2)
          nodes.push(new SyntaxListEntryNode(stmtNode))
          nodes.push(new SyntaxListSeparatorNode(finishTrivia([
            parseTriviaBetween(lastStatementChild, semicolonTsNode),
            optional
              ? hasSemicolon
                ? new OptionalSemiNode(parseTsNode(semicolonTsNode!), [new EmptyNode()])
                : new OptionalSemiNode(
                  new EmptyNode(),
                  [new (nodeClassForSyntaxKind(ts.SyntaxKind.SemicolonToken))(";")],
                )
              : parseTsNode(semicolonTsNode!),
            parseTriviaBetween(semicolonTsNode ?? lastStatementChild, children[i + 1]),
          ])))
        }
        return new SyntaxListNode(nodes)
      }
      /* eslint-enable @typescript-eslint/no-non-null-assertion */
      default:
        throw new Error("Unhandled SyntaxList Parent " + syntaxKindName(tsNode.parent.kind))
    }
  }

  function getTsChildren(node: ts.Node){
    return node.getChildren(sourceFile)
  }

  function parseTriviaBetween(a?: ts.Node, b?: ts.Node){
    if(!a || !b) return emptyTrivia()
    return parseTrivia(a.end, b.getStart(sourceFile))
  }

  function emptyTrivia(){
    return new WhitespacePositionalNode([new WhitespaceNode([])])
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
    return new WhitespacePositionalNode([new WhitespaceNode(children)])
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
