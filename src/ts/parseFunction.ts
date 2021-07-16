import ts from "typescript"
import { getChildOfKind } from "./getChildOfKind"
import { SourceFileNode } from "./SourceFileNode"
import { EmptyNode, TsNodeNode } from "./TsNodeNode"

export function parseFunction(this: SourceFileNode, tsChildren: ts.Node[]){
  // tsChildren is [
  //   <Modifiers>?,
  //   ("function" | "get" | "set")?,
  //   "*"?,
  //   <Name>?
  //   ...[
  //     "<",
  //     SyntaxList [ ... ],
  //     ">",
  //   ]?,
  //   "(",
  //   SyntaxList [ ... ],
  //   ")",
  //   ... [
  //     ":",
  //     <ReturnType>,
  //   ]?,
  //   <Body>?,
  // ]
  const tsModifiers = getChildOfKind(tsChildren, 0, ts.SyntaxKind.SyntaxList)
  const postModifierIndex = tsModifiers ? 1 : 0
  const tsFunctionKeyword = getChildOfKind(
    tsChildren,
    postModifierIndex,
    ts.SyntaxKind.FunctionKeyword,
    ts.SyntaxKind.GetKeyword,
    ts.SyntaxKind.SetKeyword,
  )
  const postFunctionKeywordIndex = postModifierIndex + (tsFunctionKeyword ? 1 : 0)
  const tsAsterisk = getChildOfKind(tsChildren, postFunctionKeywordIndex, ts.SyntaxKind.AsteriskToken)
  const postAsteriskIndex = postFunctionKeywordIndex + (tsAsterisk ? 1 : 0)
  const lessThanIndex = tsChildren.findIndex(x => x.kind === ts.SyntaxKind.LessThanToken)
  const openParenIndex = tsChildren.findIndex(x => x.kind === ts.SyntaxKind.OpenParenToken)
  const colonIndex = tsChildren.findIndex(x => x.kind === ts.SyntaxKind.ColonToken)
  const tsName = getChildOfKind(
    tsChildren,
    postAsteriskIndex,
    ts.SyntaxKind.Identifier,
    ts.SyntaxKind.ConstructorKeyword,
    ts.SyntaxKind.ComputedPropertyName,
  )
  const tsTypeParams = lessThanIndex === -1 ? undefined : tsChildren.slice(lessThanIndex, lessThanIndex + 3)
  const tsParameterList = tsChildren.slice(openParenIndex, openParenIndex + 3)
  const tsReturnTypeAnnotation = colonIndex === -1 ? undefined : tsChildren.slice(colonIndex, colonIndex + 2)
  const tsBody = tsChildren[colonIndex === -1 ? openParenIndex + 3 : colonIndex + 2]
  return new FunctionNode(this.finishTrivia([
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.parseModifiers(this.getChildren(tsModifiers) ?? [], tsFunctionKeyword ?? tsAsterisk ?? tsName!),
    tsFunctionKeyword ? this.parseTsNode(tsFunctionKeyword) : new EmptyNode(),
    tsAsterisk ? new FunctionAsteriskNode(this.finishTrivia([
      this.parseTriviaBetween(tsFunctionKeyword, tsAsterisk),
      this.parseTsNode(tsAsterisk),
    ])) : new EmptyNode(),
    tsName ? new FunctionNameNode(this.finishTrivia([
      this.parseTriviaBetween(tsAsterisk ?? tsFunctionKeyword, tsName),
      this.parseTsNode(tsName),
    ])) : new EmptyNode(),
    this.parseTriviaBetween(tsName ?? tsAsterisk ?? tsFunctionKeyword, tsTypeParams?.[0] ?? tsParameterList[0]),
    tsTypeParams ? new FunctionTypeParametersNode(this.finishTrivia([
      this.parseTypeParameters(tsTypeParams),
      this.parseTriviaBetween(tsTypeParams?.[2], tsParameterList[0]),
    ])) : new EmptyNode(),
    new FunctionParameterListNode(this.finishTrivia([
      this.parseParameterList(tsParameterList),
    ])),
    tsReturnTypeAnnotation ? new FunctionReturnTypeAnnotationNode(this.finishTrivia([
      this.parseTriviaBetween(tsParameterList[2], tsReturnTypeAnnotation[0]),
      ...this.parsePartialTsChildren(tsReturnTypeAnnotation),
    ])) : new EmptyNode(),
    tsBody ? new FunctionBodyNode(this.finishTrivia([
      this.parseTriviaBetween(tsReturnTypeAnnotation?.[1] ?? tsParameterList[2], tsBody),
      this.parseTsNode(tsBody),
    ])) : new EmptyNode(),
  ]))
}

export class FunctionNode extends TsNodeNode {}
export class FunctionAsteriskNode extends TsNodeNode {}
export class FunctionNameNode extends TsNodeNode {}
export class FunctionTypeParametersNode extends TsNodeNode {}
export class FunctionParameterListNode extends TsNodeNode {}
export class FunctionReturnTypeAnnotationNode extends TsNodeNode {}
export class FunctionBodyNode extends TsNodeNode {}
