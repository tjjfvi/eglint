import ts from "typescript"
import { Node } from "../Node"
import { SourceFileNode } from "./SourceFileNode"
import { TsNodeNode } from "./TsNodeNode"

export function parseStrippedStatement(this: SourceFileNode, tsNode: ts.Node, tsChildren: ts.Node[]): Node{
  if(tsNode.kind === ts.SyntaxKind.IfStatement)
    return this.parseIfStatement(tsNode, tsChildren)
  if(tsNode.kind === ts.SyntaxKind.ForStatement)
    return this.parseForLoop(tsNode, tsChildren)
  if(tsNode.kind === ts.SyntaxKind.ClassDeclaration || tsNode.kind === ts.SyntaxKind.InterfaceDeclaration)
    return this.parseClassLike(tsNode)
  if(tsNode.kind === ts.SyntaxKind.FunctionDeclaration)
    return this.parseFunction(tsChildren)

  return new TsNodeNode.for[tsNode.kind](this.parseChildrenWithModifiers(tsChildren))
}
