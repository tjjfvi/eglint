import ts from "typescript"
import { SourceFileNode } from "./SourceFileNode"
import { TsNodeNode } from "./TsNodeNode"

export function parseArrowFunctionParams(this: SourceFileNode, tsChildren: ts.Node[]){
  return new ArrowFunctionParamsNode(this.parseTsChildren(tsChildren))
}

export class ArrowFunctionParamsNode extends TsNodeNode {}
