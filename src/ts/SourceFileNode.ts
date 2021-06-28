import ts from "typescript"
import { Node } from "../Node"
import { TsNodeNode } from "./TsNodeNode"
import { parseSyntaxList } from "./parseSyntaxList"
import { parseStringLiteral } from "./parseStringLiteral"
import { parseArrowFunction } from "./parseArrowFunction"
import { parseCommaSyntaxList } from "./parseCommaSyntaxList"
import { parseArrowFunctionBody } from "./parseArrowFunctionBody"
import { parseArrowFunctionSig } from "./parseArrowFunctionSig"
import { emptyTrivia, finishTrivia, parseTrivia, parseTriviaBetween, spaceTrivia } from "./trivia"
import { parseBinaryExpression } from "./parseBinaryExpression"
import { parseElseStatement, parseIfStatement } from "./parseIfStatement"
import { parseLoneStatement } from "./parseLoneStatement"
import { parseSemiSyntaxList, getSemi, getSemilessChildren, getLastNonSemiChild } from "./parseSemiSyntaxList"

export class SourceFileNode extends Node {

  source = this.sourceFile.getFullText()
  indentLevel = 0

  constructor(public sourceFile: ts.SourceFile){
    super([])
    this.children = [
      ...this.parseTrivia(0, sourceFile.getStart(sourceFile)),
      ...this.parseTsChildren(sourceFile.getChildren(sourceFile)),
    ]
    this._applyChildren()
  }

  parseTsNode(
    tsNode: ts.Node,
    // May have semicolon sliced off if tsNode is a statement
    tsChildren = tsNode.getChildren(this.sourceFile),
  ): Node{
    if(tsNode.kind === ts.SyntaxKind.SyntaxList)
      return this.parseSyntaxList(tsNode as ts.SyntaxList)
    if(tsNode.kind === ts.SyntaxKind.IfStatement)
      return this.parseIfStatement(tsNode, tsChildren)
    if(tsNode.kind === ts.SyntaxKind.StringLiteral || tsNode.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral)
      return this.parseStringLiteral(tsNode)
    if(tsNode.kind === ts.SyntaxKind.ArrowFunction)
      return this.parseArrowFunction(tsNode)
    if(tsNode.kind === ts.SyntaxKind.BinaryExpression)
      return this.parseBinaryExpression(tsNode)

    if(tsChildren.length)
      return new TsNodeNode.for[tsNode.kind](this.parseTsChildren(tsChildren))
    else
      return new TsNodeNode.for[tsNode.kind](this.getText(tsNode))
  }

  parsePartialTsChildren(tsChildren: ts.Node[]){
    let children = []
    let lastPos = tsChildren[0].getStart(this.sourceFile)

    for(const child of tsChildren) {
      if(children.length)
        children.push(...this.parseTrivia(lastPos, child.getStart(this.sourceFile)))
      lastPos = child.end
      children.push(this.parseTsNode(child))
    }

    return children
  }

  parseTsChildren(tsChildren: ts.Node[]){
    return this.finishTrivia(this.parsePartialTsChildren(tsChildren))
  }

  getText(tsNode: ts.Node){
    return this.source.slice(tsNode.getStart(this.sourceFile), tsNode.end)
  }

  parseTrivia = parseTrivia
  parseTriviaBetween = parseTriviaBetween
  emptyTrivia = emptyTrivia
  spaceTrivia = spaceTrivia
  finishTrivia = finishTrivia

  parseIfStatement = parseIfStatement
  parseElseStatement = parseElseStatement
  parseLoneStatement = parseLoneStatement
  parseArrowFunction = parseArrowFunction
  parseArrowFunctionSig = parseArrowFunctionSig
  parseArrowFunctionBody = parseArrowFunctionBody
  parseSyntaxList = parseSyntaxList
  parseCommaSyntaxList = parseCommaSyntaxList
  parseSemiSyntaxList = parseSemiSyntaxList
  parseStringLiteral = parseStringLiteral
  parseBinaryExpression = parseBinaryExpression

  getSemi = getSemi
  getSemilessChildren = getSemilessChildren
  getLastNonSemiChild = getLastNonSemiChild

}
