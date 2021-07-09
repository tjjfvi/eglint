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
import { parseStatement } from "./parseStatement"
import { parseForLoop } from "./parseForLoop"
import { parseStrippedStatement } from "./parseStrippedStatement"
import { parsePropertyAssignment } from "./parsePropertyAssignment"
import { parseBindingPattern } from "./parseBindingPattern"
import { parseObjectBindingElement } from "./parseObjectBindingElement"
import {
  parseSemiSyntaxList,
  getSemi,
  getSemilessChildren,
  getLastNonSemiChild,
  parseSemi,
} from "./parseSemiSyntaxList"
import { parseArrayBindingElement } from "./parseArrayBindingElement"
import { parseModifiers, parseChildrenWithModifiers } from "./parseModifiers"
import { parseClassLike } from "./parseClassLike"
import { parseUnionIntersectionType } from "./parseUnionIntersectionType"
import { ContextProvider } from "../Context"
import { IndentationContext } from "../IndentNode"
import { parseTemplateString } from "./parseTemplateString"
import { parseTypeParameters } from "./parseTypeParameters"
import { parseParameterList } from "./parseParameterList"
import { parseFunction } from "./parseFunction"
import { Reference } from "../Reference"
import { Selection } from "../Selection"

export class SourceFileNode extends Node {

  source = this.sourceFile.getFullText()
  indent = this.source.match(/^[ \t]+/m)?.[0] ?? "  "
  indentLevel = 0
  pos = 0

  constructor(public sourceFile: ts.SourceFile){
    super([])
    this.children = [
      ...this.parseTrivia(0, sourceFile.getStart(sourceFile)),
      ...this.parseTsChildren(sourceFile.getChildren(sourceFile)),
    ]
    this._applyChildren()
  }

  override toString(contextProvider = new ContextProvider()){
    const indentation = contextProvider.getContext(IndentationContext)
    indentation.indent = this.indent
    return super.toString(contextProvider)
  }

  override _adaptTo(reference: Reference, selection: Selection<this>){
    const adapted = super._adaptTo(reference, selection) as SourceFileNode
    adapted.indent = selection.first()?.indent ?? adapted.indent
    return adapted
  }

  tsNodeNodeMemo = new Map<ts.Node, Node>()
  parseTsNode(tsNode: ts.Node): Node{
    if(this.tsNodeNodeMemo.has(tsNode))
      throw new Error("Double parsing of tsNode")
    const result = this._parseTsNode(tsNode)
    this.tsNodeNodeMemo.set(tsNode, result)
    return result
  }

  retrieveParsedTsNode(tsNode: ts.Node): Node{
    const result = this.tsNodeNodeMemo.get(tsNode)
    if(!result)
      throw new Error("tsNode not yet parsed")
    return result
  }

  _parseTsNode(tsNode: ts.Node): Node{
    if(isStatement(tsNode))
      return this.parseStatement(tsNode)
    if(tsNode.kind === ts.SyntaxKind.SyntaxList)
      return this.parseSyntaxList(tsNode as ts.SyntaxList)
    if(tsNode.kind === ts.SyntaxKind.StringLiteral || tsNode.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral)
      return this.parseStringLiteral(tsNode)
    if(tsNode.kind === ts.SyntaxKind.ArrowFunction)
      return this.parseArrowFunction(tsNode)
    if(tsNode.kind === ts.SyntaxKind.BinaryExpression)
      return this.parseBinaryExpression(tsNode)
    if(tsNode.kind === ts.SyntaxKind.PropertyAssignment || tsNode.kind === ts.SyntaxKind.ShorthandPropertyAssignment)
      return this.parsePropertyAssignment(tsNode)
    if(tsNode.kind === ts.SyntaxKind.ObjectBindingPattern || tsNode.kind === ts.SyntaxKind.ArrayBindingPattern)
      return this.parseBindingPattern(tsNode)
    if(tsNode.kind === ts.SyntaxKind.ClassExpression)
      return this.parseClassLike(tsNode)
    if(tsNode.kind === ts.SyntaxKind.UnionType || tsNode.kind === ts.SyntaxKind.IntersectionType)
      return this.parseUnionIntersectionType(tsNode)
    if(tsNode.kind === ts.SyntaxKind.TemplateExpression)
      return this.parseTemplateString(tsNode)
    if(tsNode.kind === ts.SyntaxKind.Parameter)
      return new TsNodeNode.for[tsNode.kind](this.parseChildrenWithModifiers(tsNode.getChildren()))
    if(tsNode.kind === ts.SyntaxKind.FunctionExpression || tsNode.kind === ts.SyntaxKind.MethodDeclaration)
      return this.parseFunction(tsNode.getChildren())

    const tsChildren = tsNode.getChildren()

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

  peekText(tsNode: ts.Node){
    return this.source.slice(tsNode.getStart(this.sourceFile), tsNode.end)
  }

  getText(tsNode: ts.Node){
    const start = tsNode.getStart(this.sourceFile)
    if(this.pos !== start)
      throw new Error(`Gap at positions ${this.pos}-${start}`)
    this.pos = tsNode.end
    return this.peekText(tsNode)
  }

  parseTrivia = parseTrivia
  parseTriviaBetween = parseTriviaBetween
  emptyTrivia = emptyTrivia
  spaceTrivia = spaceTrivia
  finishTrivia = finishTrivia

  parseArrowFunction = parseArrowFunction
  parseArrowFunctionSig = parseArrowFunctionSig
  parseArrowFunctionBody = parseArrowFunctionBody
  parseSyntaxList = parseSyntaxList
  parseCommaSyntaxList = parseCommaSyntaxList
  parseSemiSyntaxList = parseSemiSyntaxList
  parseStringLiteral = parseStringLiteral
  parseBinaryExpression = parseBinaryExpression
  parsePropertyAssignment = parsePropertyAssignment
  parseModifiers = parseModifiers
  parseChildrenWithModifiers = parseChildrenWithModifiers
  parseClassLike = parseClassLike
  parseUnionIntersectionType = parseUnionIntersectionType
  parseTemplateString = parseTemplateString
  parseTypeParameters = parseTypeParameters
  parseParameterList = parseParameterList
  parseFunction = parseFunction

  parseBindingPattern = parseBindingPattern
  parseObjectBindingElement = parseObjectBindingElement
  parseArrayBindingElement = parseArrayBindingElement

  parseSemi = parseSemi
  getSemi = getSemi
  getSemilessChildren = getSemilessChildren
  getLastNonSemiChild = getLastNonSemiChild

  parseStatement = parseStatement
  parseStrippedStatement = parseStrippedStatement
  parseForLoop = parseForLoop
  parseIfStatement = parseIfStatement
  parseElseStatement = parseElseStatement

}

const isStatement = (ts as any).isStatement as (node: ts.Node) => boolean
