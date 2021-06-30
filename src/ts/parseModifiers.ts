import ts from "typescript"
import { Node } from "../Node"
import { SourceFileNode } from "./SourceFileNode"
import { TsNodeNode } from "./TsNodeNode"

export function parseModifiers(this: SourceFileNode, tsModifiers: ts.Node[], tsNext: ts.Node){
  return new ModifierGroupNode(
    tsModifiers.map((tsModifier, i) =>
      new ModifierNode(this.finishTrivia([
        this.parseTsNode(tsModifier),
        ...this.parseTriviaBetween(tsModifier, tsModifiers[i + 1] ?? tsNext),
      ])),
    ),
  )
}

export class ModifierGroupNode extends Node {}
export class ModifierNode extends TsNodeNode {}
