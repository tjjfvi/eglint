import ts from "typescript"
import { InterchangeableNode } from "../InterchangeableNode"
import { propertyFilter } from "../propertyFilter"
import { SyntaxListSeparatorNode, SyntaxListEntryNode, SyntaxListNode } from "./parseSyntaxList"
import { SourceFileNode } from "./SourceFileNode"

export function parseUnionIntersectionType(this: SourceFileNode, tsNode: ts.Node){
  const tsChildren = this.getChildren(this.getChildren(tsNode)[0])
  const isUnion = tsNode.kind === ts.SyntaxKind.UnionType
  const separatorKind = isUnion ? ts.SyntaxKind.BarToken : ts.SyntaxKind.AmpersandToken
  const nodes = []
  if(tsChildren[0].kind !== separatorKind)
    nodes.push(new SyntaxListSeparatorNode(this.finishTrivia([
      this.emptyTrivia(),
      new (isUnion ? LeadingBarNode : LeadingAmpersandNode)(false),
      this.emptyTrivia(),
    ])))
  for(const [i, tsChild] of tsChildren.entries())
    if(tsChild.kind === separatorKind)
      nodes.push(new SyntaxListSeparatorNode(this.finishTrivia([
        this.parseTriviaBetween(tsChildren[i - 1], tsChild),
        i === 0
          ? (this.getText(tsChild), new (isUnion ? LeadingBarNode : LeadingAmpersandNode)(true))
          : this.parseTsNode(tsChild),
        this.parseTriviaBetween(tsChild, tsChildren[i + 1]),
      ])))
    else
      nodes.push(new SyntaxListEntryNode(this.parseTsNode(tsChild)))
  return new SyntaxListNode(nodes)
}

export class LeadingBarNode extends InterchangeableNode {

  constructor(public present: boolean){
    super()
    this.filterGroup.addFilter(propertyFilter("present"))
  }

  override toString(){
    return this.present ? "|" : ""
  }

  override get hasText(){
    return this.present
  }

  override get requireContext(){
    return true
  }

}

export class LeadingAmpersandNode extends InterchangeableNode {

  constructor(public present: boolean){
    super()
    this.filterGroup.addFilter(propertyFilter("present"))
  }

  override toString(){
    return this.present ? "&" : ""
  }

  override get hasText(){
    return this.present
  }

  override get requireContext(){
    return true
  }

}

