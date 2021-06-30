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

  if(tsChildren[0].kind === ts.SyntaxKind.SyntaxList)
    return new TsNodeNode.for[tsNode.kind]([
      this.parseModifiers(tsChildren[0].getChildren(), tsChildren[1]),
      ...this.parseTsChildren(tsChildren.slice(1)),
    ])

  return new TsNodeNode.for[tsNode.kind]([
    this.parseModifiers([], tsChildren[0]),
    ...this.parseTsChildren(tsChildren),
  ])
}
