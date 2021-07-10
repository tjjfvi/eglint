import ts from "typescript"
import { SourceFileNode } from "./SourceFileNode"
import { TsNodeNode } from "./TsNodeNode"

export function parseTypeParameters(this: SourceFileNode, tsChildren: ts.Node[]){
  if(tsChildren.length !== 3)
    throw new Error("Invalid parameter list")
  return new TypeParametersNode(this.finishTrivia([
    this.parseTsNode(tsChildren[0]),
    this.parseTriviaBetween(tsChildren[0], tsChildren[1]),
    this.parseCommaSyntaxList(tsChildren[1] as ts.SyntaxList),
    this.parseTriviaBetween(tsChildren[1], tsChildren[2]),
    this.parseTsNode(tsChildren[2]),
  ]))
}

export class TypeParametersNode extends TsNodeNode {}
