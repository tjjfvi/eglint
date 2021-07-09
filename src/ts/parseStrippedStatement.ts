import ts from "typescript"
import { Node } from "../Node"
import { SourceFileNode } from "./SourceFileNode"
import { TsNodeNode } from "./TsNodeNode"

export function parseStrippedStatement(this: SourceFileNode, tsNode: ts.Node, tsChildren: ts.Node[]): Node{
  switch(tsNode.kind) {
    case ts.SyntaxKind.IfStatement:
      return this.parseIfStatement(tsNode, tsChildren)
    case ts.SyntaxKind.ForStatement:
      return this.parseForLoop(tsNode, tsChildren)
    case ts.SyntaxKind.ClassDeclaration:
    case ts.SyntaxKind.InterfaceDeclaration:
      return this.parseClassLike(tsNode)
    case ts.SyntaxKind.FunctionDeclaration:
    case ts.SyntaxKind.MethodDeclaration:
    case ts.SyntaxKind.Constructor:
      return this.parseFunction(tsChildren)
    default:
      return new TsNodeNode.for[tsNode.kind](this.parseChildrenWithModifiers(tsChildren))
  }
}
