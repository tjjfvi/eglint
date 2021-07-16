import ts from "typescript"
import { ForkNode } from "../ForkNode"
import { IndentNode } from "../IndentNode"
import { SourceFileNode } from "./SourceFileNode"
import { TsNodeNode } from "./TsNodeNode"

const { PropertyAssignment, ColonToken } = TsNodeNode.for

export function parsePropertyAssignment(this: SourceFileNode, tsNode: ts.Node){
  const tsChildren = this.getChildren(tsNode)
  if(tsNode.kind === ts.SyntaxKind.ShorthandPropertyAssignment) {
    const identifier = this.parseTsNode(tsChildren[0])
    return new SwappablePropertyAssignmentNode(
      identifier,
      new PropertyAssignment([
        identifier,
        this.emptyTrivia(),
        new ColonToken(":"),
        this.emptyTrivia(),
        identifier,
        new IndentNode(0),
      ]),
    )
  }
  if(tsChildren[2].kind !== ts.SyntaxKind.Identifier || this.peekText(tsChildren[2]) !== this.peekText(tsChildren[0]))
    return new PropertyAssignment(this.parseTsChildren(tsChildren))
  return new SwappablePropertyAssignmentNode(
    new PropertyAssignment(this.parseTsChildren(tsChildren)),
    this.retrieveParsedTsNode(tsChildren[0]),
  )
}

export class SwappablePropertyAssignmentNode extends ForkNode {}
