import ts from "typescript"
import { Node } from "../Node"
import { NewlineNode } from "../NewlineNode"
import { PositionalNode } from "../PositionalNode"
import { SpaceNode } from "../SpaceNode"
import { IndentNode } from "../IndentNode"
import {
  TsNodeNode,
  WhitespaceNode,
  WhitespacePositionalNode,
} from "./TsNodeNode"
import { parseSyntaxList } from "./parseSyntaxList"
import { parseStringLiteral } from "./parseStringLiteral"
import { parseArrowFunction } from "./parseArrowFunction"
import { parseCommaSyntaxList } from "./parseCommaSyntaxList"
import { parseSemiSyntaxList } from "./parseSemiSyntaxList"
import { parseArrowFunctionBody } from "./parseArrowFunctionBody"
import { parseArrowFunctionParams } from "./parseArrowFunctionParams"

export class SourceFileNode extends Node {

  source = this.sourceFile.getFullText()
  indentLevel = 0

  constructor(public sourceFile: ts.SourceFile){
    super([])
    this.children = [
      this.parseTrivia(0, sourceFile.getStart(sourceFile)),
      ...this.parseTsChildren(sourceFile.getChildren(sourceFile)),
    ]
    this._applyChildren()
  }

  parseTsNode(tsNode: ts.Node): Node{
    if(tsNode.kind === ts.SyntaxKind.SyntaxList)
      return this.parseSyntaxList(tsNode as ts.SyntaxList)
    if(tsNode.kind === ts.SyntaxKind.StringLiteral || tsNode.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral)
      return this.parseStringLiteral(tsNode)
    if(tsNode.kind === ts.SyntaxKind.ArrowFunction)
      return this.parseArrowFunction(tsNode)

    const tsChildren = tsNode.getChildren(this.sourceFile)
    const NodeClass = TsNodeNode.for(tsNode.kind)

    if(tsChildren.length)
      return new NodeClass(this.parseTsChildren(tsNode.getChildren(this.sourceFile)))
    else
      return new NodeClass(this.getText(tsNode))
  }

  parseTsChildren(tsChildren: ts.Node[]){
    let children = []
    let lastPos = tsChildren[0].getStart(this.sourceFile)

    for(const child of tsChildren) {
      if(children.length)
        children.push(this.parseTrivia(lastPos, child.getStart(this.sourceFile)))
      lastPos = child.end
      children.push(this.parseTsNode(child))
    }

    return this.finishTrivia(children)
  }

  getText(tsNode: ts.Node){
    return this.source.slice(tsNode.getStart(this.sourceFile), tsNode.end)
  }

  parseTriviaBetween(a?: ts.Node, b?: ts.Node){
    if(!a || !b) return this.emptyTrivia()
    return this.parseTrivia(a.end, b.getStart(this.sourceFile))
  }

  emptyTrivia(){
    return new WhitespacePositionalNode([new WhitespaceNode([])])
  }

  spaceTrivia(){
    return new WhitespacePositionalNode([new WhitespaceNode([new SpaceNode(1)])])
  }

  parseTrivia(start: number, end: number){
    const text = this.source.slice(start, end)
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
        const deltaIndent = Math.floor((match.length - 1) / 2) - this.indentLevel
        this.indentLevel += deltaIndent
        children.push(new NewlineNode(deltaIndent))
      }
      // else children.push(new TextNode(match))
    }
    return new WhitespacePositionalNode([new WhitespaceNode(children)])
  }

  finishTrivia(children: Node[]){
    let deltaIndent = 0
    for(const child of children)
      if(child instanceof PositionalNode)
        if(child.children[0] instanceof WhitespaceNode)
          for(const node of child.children[0].children)
            if(node instanceof NewlineNode)
              deltaIndent += node.deltaIndent
    children.push(new IndentNode(-deltaIndent))
    this.indentLevel -= deltaIndent
    return children
  }

  parseArrowFunction = parseArrowFunction
  parseArrowFunctionParams = parseArrowFunctionParams
  parseArrowFunctionBody = parseArrowFunctionBody
  parseCommaSyntaxList = parseCommaSyntaxList
  parseSemiSyntaxList = parseSemiSyntaxList
  parseStringLiteral = parseStringLiteral
  parseSyntaxList = parseSyntaxList

}
