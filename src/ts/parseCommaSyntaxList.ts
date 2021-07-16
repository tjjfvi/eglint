import ts, { SyntaxList } from "typescript"
import { InterchangeableNode } from "../InterchangeableNode"
import { propertyFilter } from "../propertyFilter"
import { SyntaxListSeparatorNode, SyntaxListEntryNode, SyntaxListNode } from "./parseSyntaxList"
import { SourceFileNode } from "./SourceFileNode"

export function parseCommaSyntaxList(this: SourceFileNode, tsNode: SyntaxList, parseChild = this.parseTsNode){
  const children = this.getChildren(tsNode)
  const nodes = []
  for(const [i, child] of children.entries())
    if(child.kind === ts.SyntaxKind.CommaToken)
      nodes.push(new SyntaxListSeparatorNode(this.finishTrivia([
        this.parseTriviaBetween(children[i - 1], child),
        i === children.length - 1
          ? (this.getText(child), new TrailingCommaNode(true))
          : this.parseTsNode(child),
        this.parseTriviaBetween(child, children[i + 1]),
      ])))
    else
      nodes.push(new SyntaxListEntryNode(parseChild.call(this, child)))
  if(children.length && children[children.length - 1].kind !== ts.SyntaxKind.CommaToken)
    nodes.push(new SyntaxListSeparatorNode(this.finishTrivia([
      this.emptyTrivia(),
      new TrailingCommaNode(false),
      this.emptyTrivia(),
    ])))
  return new SyntaxListNode(nodes)
}

export class TrailingCommaNode extends InterchangeableNode {

  constructor(public present: boolean){
    super()
    this.filterGroup.addFilter(propertyFilter("present"))
  }

  override toString(){
    return this.present ? "," : ""
  }

  override get hasText(){
    return this.present
  }

  override get requireContext(){
    return true
  }

}

