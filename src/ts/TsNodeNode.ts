
import ts from "typescript"
import { Node } from "../Node"
import { NewlineNode } from "../NewlineNode"
import { syntaxKindName } from "./tsUtils"
import { IndentNode } from "../IndentNode"
import { propertyFilter } from "../propertyFilter"

export class TsNodeNode extends Node {

  constructor(args: readonly [...Node[], IndentNode] | string){
    super(args)
  }

  static checkMultiline(node: Node): boolean{
    return false
      || node instanceof TsNodeNode && node.isMultiline
      || node instanceof NewlineNode
      || node.children.some(TsNodeNode.checkMultiline)
      || node.text.includes("\n")
  }

  isMultiline = TsNodeNode.checkMultiline(this)

  override init(){
    super.init()
    this.filterGroup.addFilter({
      priority: .5,
      filter: propertyFilter("isMultiline"),
    })
  }

  static for: Record<ts.SyntaxKind | keyof typeof ts.SyntaxKind, typeof TsNodeNode> = Object.fromEntries(
    [...new Set(Object.values(ts.SyntaxKind))]
      .filter((x): x is ts.SyntaxKind => typeof x === "number")
      .flatMap((kind): [ts.SyntaxKind | keyof typeof ts.SyntaxKind, typeof TsNodeNode][] => {
        const name = syntaxKindName(kind)
        let priority = 1
        if(kind >= ts.SyntaxKind.FirstPunctuation && kind <= ts.SyntaxKind.LastPunctuation)
          priority = 2

        class BaseClass extends TsNodeNode {

          override get priority(){
            return priority
          }

        }

        const NamedClass = { [name]: class extends BaseClass {} }[name]

        return [[kind, NamedClass], [name as keyof typeof ts.SyntaxKind, NamedClass]]
      }),
  ) as never

}

export class EmptyNode extends Node {}

