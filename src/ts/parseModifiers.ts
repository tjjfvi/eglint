import ts from "typescript"
import { IndentNode } from "../IndentNode"
import { Node } from "../Node"
import { SourceFileNode } from "./SourceFileNode"
import { TsNodeNode } from "./TsNodeNode"

export function parseModifiers(this: SourceFileNode, tsModifiers: ts.Node[], tsNext: ts.Node){
  return new ModifierGroupNode(
    tsModifiers.map((tsModifier, i) =>
      new ModifierNode(this.finishTrivia([
        this.parseTsNode(tsModifier),
        this.parseTriviaBetween(tsModifier, tsModifiers[i + 1] ?? tsNext),
      ])),
    ),
  )
}

export function parseChildrenWithModifiers(
  this: SourceFileNode,
  tsChildren: ts.Node[],
  inner = this.parseTsChildren,
): [...Node[], IndentNode]{
  if(tsChildren[0].kind === ts.SyntaxKind.SyntaxList)
    return [
      this.parseModifiers(this.getChildren(tsChildren[0]), tsChildren[1]),
      ...inner.call(this, tsChildren.slice(1)),
    ]

  return [
    this.parseModifiers([], tsChildren[0]),
    ...inner.call(this, tsChildren),
  ]
}

export class ModifierGroupNode extends Node {}
export class ModifierNode extends TsNodeNode {}
