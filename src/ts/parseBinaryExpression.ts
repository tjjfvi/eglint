import ts from "typescript"
import { SingletonNode } from "../SingletonNode"
import { SourceFileNode } from "./SourceFileNode"
import { TsNodeNode } from "./TsNodeNode"

export function parseBinaryExpression(this: SourceFileNode, tsNode: ts.Node){
  const children = tsNode.getChildren(this.sourceFile)
  if(children.length !== 3)
    throw new Error("Invalid BinaryExpression")
  const [a, op, b] = children
  return new TsNodeNode.for.BinaryExpression(this.finishTrivia([
    op.kind >= ts.SyntaxKind.FirstAssignment && op.kind <= ts.SyntaxKind.LastAssignment
      ? this.parseBindingPattern(a)
      : this.parseTsNode(a),
    this.parseTriviaBetween(a, op),
    new OperatorNode(this.parseTsNode(op)),
    this.parseTriviaBetween(op, b),
    this.parseTsNode(b),
  ]))
}

export class OperatorNode extends SingletonNode {

  override get priority(){
    return 2
  }

}
