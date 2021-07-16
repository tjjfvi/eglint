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
import { syntaxKindName } from "./tsUtils"
import { inspect } from "../utils"

export class SourceFileNode extends Node {

  source = this.sourceFile.getFullText()
  indent = this.source.match(/^[ \t]+/m)?.[0] ?? "  "
  indentLevel = 0
  pos = 0

  constructor(public sourceFile: ts.SourceFile){
    super([])
    this.children = [
      this.parseTrivia(0, this.getStart(sourceFile)),
      ...this.parseTsChildren(this.getChildren(sourceFile)),
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
    switch(tsNode.kind) {
      case ts.SyntaxKind.JSDocComment:
        return this.parseTrivia(tsNode.getStart(), tsNode.end)
      case ts.SyntaxKind.SyntaxList:
        return this.parseSyntaxList(tsNode as ts.SyntaxList)
      case ts.SyntaxKind.StringLiteral || tsNode.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral:
        return this.parseStringLiteral(tsNode)
      case ts.SyntaxKind.ArrowFunction:
        return this.parseArrowFunction(tsNode)
      case ts.SyntaxKind.BinaryExpression:
        return this.parseBinaryExpression(tsNode)
      case ts.SyntaxKind.PropertyAssignment:
      case ts.SyntaxKind.ShorthandPropertyAssignment:
        return this.parsePropertyAssignment(tsNode)
      case ts.SyntaxKind.ObjectBindingPattern:
      case ts.SyntaxKind.ArrayBindingPattern:
        return this.parseBindingPattern(tsNode)
      case ts.SyntaxKind.ClassExpression:
        return this.parseClassLike(tsNode)
      case ts.SyntaxKind.UnionType:
      case ts.SyntaxKind.IntersectionType:
        return this.parseUnionIntersectionType(tsNode)
      case ts.SyntaxKind.TemplateExpression:
        return this.parseTemplateString(tsNode)
      case ts.SyntaxKind.Parameter:
        return new TsNodeNode.for.Parameter(this.parseChildrenWithModifiers(this.getChildren(tsNode)))
      case ts.SyntaxKind.FunctionExpression:
      case ts.SyntaxKind.MethodDeclaration:
      case ts.SyntaxKind.GetAccessor:
      case ts.SyntaxKind.SetAccessor:
        return this.parseFunction(this.getChildren(tsNode))
    }

    const tsChildren = this.getChildren(tsNode)

    if(tsChildren.length)
      return new TsNodeNode.for[tsNode.kind](this.parseTsChildren(tsChildren))
    else
      return new TsNodeNode.for[tsNode.kind](this.getText(tsNode))
  }

  parsePartialTsChildren(tsChildren: ts.Node[]){
    if(!tsChildren.length) return []

    let children = []
    let lastPos = this.getStart(tsChildren[0])

    for(const child of tsChildren) {
      if(children.length)
        children.push(this.parseTrivia(lastPos, this.getStart(child)))
      lastPos = child.end
      children.push(this.parseTsNode(child))
    }

    return children
  }

  parseTsChildren(tsChildren: ts.Node[]){
    return this.finishTrivia(this.parsePartialTsChildren(tsChildren))
  }

  peekText(tsNode: ts.Node){
    return this.source.slice(this.getStart(tsNode), tsNode.end)
  }

  getChildren(tsNode: ts.Node): ts.Node[]
  getChildren(tsNode: ts.Node | null | undefined): ts.Node[] | undefined
  getChildren(tsNode: ts.Node | null | undefined): ts.Node[] | undefined{
    return tsNode?.getChildren().filter(x => x.kind !== ts.SyntaxKind.JSDocComment)
  }

  getText(tsNode: ts.Node){
    const start = this.getStart(tsNode)
    if(this.pos !== start)
      throw new Error(`Gap at positions ${this.pos}-${start}`)
    this.pos = tsNode.end
    return this.peekText(tsNode)
  }

  // See the values of .getStart() for JSDocComment & PropertyAssignment in
  // https://ts-ast-viewer.com/#code/FAYw9gdgzgLgBADzgXjgb2HLcD0AqPOAQwCMQ48dNsiAuOAVgBpgBfYIA
  getStart(tsNode: ts.Node): number{
    while(tsNode.kind !== ts.SyntaxKind.JSDocComment && this.getChildren(tsNode).length)
      tsNode = this.getChildren(tsNode)[0]
    return tsNode.getStart()
  }

  printTsNode(node: ts.Node, indent = 0){
    const children = this.getChildren(node)
    const start = this.getStart(node)
    const end = node.end
    const text = this.peekText(node)
    console.log(
      "| ".repeat(indent) + syntaxKindName(node.kind),
      `${inspect(start)}-${inspect(end)}`,
      (children.length ? "{" : inspect(text) + ","),
    )
    for(const child of children) this.printTsNode(child, indent + 1)
    if(children.length) console.log("| ".repeat(indent) + "},")
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
