
import ts from "typescript"
import { Node } from "../Node"
import { InterchangeableNode } from "../InterchangeableNode"
import { NewlineNode } from "../NewlineNode"
import { PositionalNode } from "../PositionalNode"
import { syntaxKindName } from "./tsUtils"
import { cacheFn } from "../cacheFn"

export class TsNodeNode extends Node {

  static checkMultiline(node: Node): boolean{
    return false
      || node instanceof TsNodeNode && node.isMultiline
      || node instanceof NewlineNode
      || node.children.some(TsNodeNode.checkMultiline)
  }

  isMultiline = TsNodeNode.checkMultiline(this)

  multilineFilter = this.filterGroup.addFilter({
    priority: .5,
    filter(self, nodes){
      return nodes.filter(x => x.isMultiline === self.isMultiline)
    },
  })

  static for = cacheFn(
    (kind: ts.SyntaxKind): typeof TsNodeNode => {
      const name = syntaxKindName(kind)
      let priority = 1
      if(kind >= ts.SyntaxKind.FirstPunctuation && kind <= ts.SyntaxKind.LastPunctuation)
        priority = 2

      class BaseClass extends TsNodeNode {

        override get priority(){
          return priority
        }

      }

      return { [name]: class extends BaseClass {} }[name]
    },
    new Map<ts.SyntaxKind, typeof TsNodeNode>(),
  )

}

export class EmptyNode extends Node {}

export class WhitespaceNode extends InterchangeableNode {

  multiline = this.children.some(x => x instanceof NewlineNode)

}

export class WhitespacePositionalNode extends PositionalNode {

  override get priority(){
    return -1
  }

}

