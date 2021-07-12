import ts from "typescript"
import { SourceFileNode } from "./SourceFileNode"
import { TsNodeNode } from "./TsNodeNode"

export function parseArrowFunction(this: SourceFileNode, tsNode: ts.Node){
  // An ArrowFunction node can be one of many different shapes, but the last two nodes
  // (excluding the modifiers) are always [ "=>", <Body> ], and the other nodes are always the signature
  const tsChildren = tsNode.getChildren(this.sourceFile)
  const hasModifiers = true
    && tsChildren[0].kind === ts.SyntaxKind.SyntaxList
    && tsChildren[1].kind !== ts.SyntaxKind.EqualsGreaterThanToken
  const l = tsChildren.length
  return new TsNodeNode.for.ArrowFunction(this.finishTrivia([
    this.parseModifiers(hasModifiers ? tsChildren[0].getChildren() : [], tsChildren[1]),
    this.parseArrowFunctionSig(tsChildren.slice(hasModifiers ? 1 : 0, -2)),
    this.parseTriviaBetween(tsChildren[l - 3], tsChildren[l - 2]),
    this.parseTsNode(tsChildren[l - 2]),
    this.parseTriviaBetween(tsChildren[l - 2], tsChildren[l - 1]),
    this.parseArrowFunctionBody(tsChildren[l - 1]),
  ]))
}
