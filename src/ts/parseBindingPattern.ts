import ts from "typescript"
import { Node } from "../Node"
import { SourceFileNode } from "./SourceFileNode"
import { TsNodeNode } from "./TsNodeNode"

const { ObjectBindingPattern, ArrayBindingPattern } = TsNodeNode.for

export function parseBindingPattern(this: SourceFileNode, tsNode: ts.Node): Node{
  // tsNode is one of
  // - Identifier
  // - PropertyAccessExpression
  // - ElementAccessExpression
  // - OmittedExpression
  // - ObjectBindingPattern
  // - ArrayBindingPattern
  // - ObjectLiteralExpression
  // - ArrayLiteralExpression
  // The latter two are produced in code like `[a, { b }] = c` (note assignment expression, not variable declaration).
  switch(tsNode.kind) {
    case ts.SyntaxKind.Identifier:
    case ts.SyntaxKind.PropertyAccessExpression:
    case ts.SyntaxKind.ElementAccessExpression:
    case ts.SyntaxKind.OmittedExpression:
      return this.parseTsNode(tsNode)

    case ts.SyntaxKind.ObjectBindingPattern:
    case ts.SyntaxKind.ObjectLiteralExpression: {
      const [tsOpenBrace, tsSyntaxList, tsCloseBrace] = tsNode.getChildren()
      return new ObjectBindingPattern(this.finishTrivia([
        this.parseTsNode(tsOpenBrace),
        this.parseTriviaBetween(tsOpenBrace, tsSyntaxList),
        this.parseCommaSyntaxList(tsSyntaxList as ts.SyntaxList, this.parseObjectBindingElement),
        this.parseTriviaBetween(tsSyntaxList, tsCloseBrace),
        this.parseTsNode(tsCloseBrace),
      ]))
    }

    case ts.SyntaxKind.ArrayBindingPattern:
    case ts.SyntaxKind.ArrayLiteralExpression: {
      const [tsOpenBracket, tsSyntaxList, tsCloseBracket] = tsNode.getChildren()
      return new ArrayBindingPattern(this.finishTrivia([
        this.parseTsNode(tsOpenBracket),
        this.parseTriviaBetween(tsOpenBracket, tsSyntaxList),
        this.parseCommaSyntaxList(tsSyntaxList as ts.SyntaxList, this.parseArrayBindingElement),
        this.parseTriviaBetween(tsSyntaxList, tsCloseBracket),
        this.parseTsNode(tsCloseBracket),
      ]))
    }

    default:
      this.printTsNode(tsNode)
      throw new Error("Invalid binding pattern")
  }

}
