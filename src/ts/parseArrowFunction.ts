import ts from "typescript"
import { SourceFileNode } from "./SourceFileNode"
import { TsNodeNode } from "./TsNodeNode"

export function parseArrowFunction(this: SourceFileNode, tsNode: ts.Node){
  // An ArrowFunction node can either be:
  // - ArrowFunction [ OpenParenToken, SyntaxList[ ... ], CloseParenToken, EqualsGreaterThanToken, <Body> ]
  // - ArrowFunction [ SyntaxList [ Parameter [ Identifier ] ], EqualsGreaterThanToken, <Body> ]
  const tsChildren = tsNode.getChildren(this.sourceFile)
  if(tsChildren.length === 5)
    return new TsNodeNode.for.ArrowFunction([
      this.parseArrowFunctionParams(tsChildren.slice(0, 3)),
      this.parseTriviaBetween(tsChildren[2], tsChildren[3]),
      this.parseTsNode(tsChildren[3]),
      this.parseTriviaBetween(tsChildren[3], tsChildren[4]),
      this.parseArrowFunctionBody(tsChildren[4]),
    ])
  else if(tsChildren.length === 3)
    return new TsNodeNode.for.ArrowFunction([
      this.parseArrowFunctionParams(tsChildren.slice(0, 1)),
      this.parseTriviaBetween(tsChildren[0], tsChildren[1]),
      this.parseTsNode(tsChildren[1]),
      this.parseTriviaBetween(tsChildren[1], tsChildren[2]),
      this.parseArrowFunctionBody(tsChildren[2]),
    ])
  else
    throw new Error("Invalid ArrowFunction")
}
