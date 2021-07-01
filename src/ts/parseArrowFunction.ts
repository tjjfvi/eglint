import ts from "typescript"
import { SourceFileNode } from "./SourceFileNode"
import { TsNodeNode } from "./TsNodeNode"

export function parseArrowFunction(this: SourceFileNode, tsNode: ts.Node){
  // An ArrowFunction node can be one of many different shapes, but
  // the last two nodes are always [ "=>", <Body> ], and the other nodes are always the signature
  const tsChildren = tsNode.getChildren(this.sourceFile)
  const l = tsChildren.length
  return new TsNodeNode.for.ArrowFunction(this.finishTrivia([
    this.parseArrowFunctionSig(tsChildren.slice(0, -2)),
    ...this.parseTriviaBetween(tsChildren[l - 3], tsChildren[l - 2]),
    this.parseTsNode(tsChildren[l - 2]),
    ...this.parseTriviaBetween(tsChildren[l - 2], tsChildren[l - 1]),
    this.parseArrowFunctionBody(tsChildren[l - 1]),
  ]))
}
