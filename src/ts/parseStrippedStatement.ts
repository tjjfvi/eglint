import ts from "typescript"
import { SourceFileNode } from "./SourceFileNode"
import { TsNodeNode } from "./TsNodeNode"

export function parseStrippedStatement(this: SourceFileNode, tsNode: ts.Node, tsChildren: ts.Node[]){
  if(tsNode.kind === ts.SyntaxKind.IfStatement)
    return this.parseIfStatement(tsNode, tsChildren)
  if(tsNode.kind === ts.SyntaxKind.ForStatement)
    return this.parseForLoop(tsNode, tsChildren)

  return new TsNodeNode.for[tsNode.kind](this.parseTsChildren(tsChildren))
}
