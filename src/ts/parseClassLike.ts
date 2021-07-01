import ts from "typescript"
import { SourceFileNode } from "./SourceFileNode"
import { EmptyNode, TsNodeNode } from "./TsNodeNode"

export function parseClassLike(this: SourceFileNode, tsNode: ts.Node){
  // tsNode is [
  //   <Modifiers>?,
  //   "class" | "interface",
  //   <Name: Identifier>?,
  //   ...[
  //     "<",
  //     SyntaxList [ ... ],
  //     ">",
  //   ]?,
  //   SyntaxList [
  //     <ExtendsClause>?,
  //     <ImplementsClause>?,
  //   ]?,
  //   "{",
  //   <Body>,
  //   "}",
  // ]
  const tsChildren = tsNode.getChildren()
  const classKeywordIndex = tsChildren.findIndex(x =>
    x.kind === ts.SyntaxKind.ClassKeyword || x.kind === ts.SyntaxKind.InterfaceKeyword,
  )
  const openBraceIndex = tsChildren.findIndex(x => x.kind === ts.SyntaxKind.OpenBraceToken)
  const lessThanIndex = tsChildren.findIndex(x => x.kind === ts.SyntaxKind.LessThanToken)
  const tsModifiers = tsChildren[classKeywordIndex - 1]?.getChildren() ?? []
  const tsClassKeyword = tsChildren[classKeywordIndex]
  const tsName = tsChildren[classKeywordIndex + 1].kind === ts.SyntaxKind.Identifier
    ? tsChildren[classKeywordIndex + 1]
    : undefined
  const tsTypeParams = lessThanIndex !== -1
    ? tsChildren.slice(lessThanIndex, lessThanIndex + 3)
    : undefined
  const tsClauses = tsChildren[openBraceIndex - 1].kind === ts.SyntaxKind.SyntaxList
    ? tsChildren[openBraceIndex - 1].getChildren()
    : []
  const tsExtendsClause = tsClauses.find(x => x.getChildren()[0].kind === ts.SyntaxKind.ExtendsKeyword)
  const tsImplementsClause = tsClauses.find(x => x.getChildren()[0].kind === ts.SyntaxKind.ImplementsKeyword)
  const tsOpenBrace = tsChildren[openBraceIndex]
  const tsBody = tsChildren[openBraceIndex + 1]
  const tsCloseBrace = tsChildren[openBraceIndex + 2]
  return new ClassLikeNode(this.finishTrivia([
    this.parseModifiers(tsModifiers, tsClassKeyword),
    this.parseTsNode(tsClassKeyword),
    tsName ? new ClassNameNode(this.finishTrivia([
      ...this.parseTriviaBetween(tsClassKeyword, tsName),
      this.parseTsNode(tsName),
    ])) : new EmptyNode(),
    tsTypeParams ? new ClassTypeParametersNode(this.finishTrivia([
      ...this.parseTriviaBetween(tsName ?? tsClassKeyword, tsTypeParams[0]),
      this.parseTypeParameters(tsTypeParams),
    ])) : new EmptyNode(),
    tsExtendsClause ? new ClassClauseNode(this.finishTrivia([
      ...this.parseTriviaBetween(tsTypeParams?.[2] ?? tsName ?? tsClassKeyword, tsExtendsClause),
      this.parseTsNode(tsExtendsClause),
    ])) : new EmptyNode(),
    tsImplementsClause ? new ClassClauseNode(this.finishTrivia([
      ...this.parseTriviaBetween(tsExtendsClause ?? tsTypeParams?.[2] ?? tsName ?? tsClassKeyword, tsImplementsClause),
      this.parseTsNode(tsImplementsClause),
    ])) : new EmptyNode(),
    ...this.parseTriviaBetween(tsChildren[openBraceIndex - 1], tsOpenBrace),
    this.parseTsNode(tsOpenBrace),
    ...this.parseTriviaBetween(tsOpenBrace, tsBody),
    this.parseSemiSyntaxList(tsBody),
    ...this.parseTriviaBetween(tsBody, tsCloseBrace),
    this.parseTsNode(tsCloseBrace),
  ]))
}

export class ClassLikeNode extends TsNodeNode {}
export class ClassNameNode extends TsNodeNode {}
export class ClassTypeParametersNode extends TsNodeNode {}
export class ClassClauseNode extends TsNodeNode {}
