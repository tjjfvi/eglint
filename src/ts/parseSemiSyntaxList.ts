import ts from "typescript"
import { FilterGroup } from "../FilterGroup"
import { Node } from "../Node"
import { SyntaxListEntryNode, SyntaxListSeparatorNode, SyntaxListNode } from "./parseSyntaxList"
import { SourceFileNode } from "./SourceFileNode"
import { TriviaNode } from "./trivia"
import { TsNodeNode } from "./TsNodeNode"

/* eslint-disable @typescript-eslint/no-non-null-assertion */
export function parseSemiSyntaxList(this: SourceFileNode, tsNode: ts.Node){
  const children = tsNode.getChildren()
  const nodes = []
  for(const [i, child] of children.entries()) {
    const grandchildren = child.getChildren()
    const hasSemicolon = grandchildren[grandchildren.length - 1]?.kind === ts.SyntaxKind.SemicolonToken
    const semicolonTsNode = hasSemicolon ? grandchildren[grandchildren.length - 1] : undefined
    const lastStatementChild = grandchildren[grandchildren.length - (hasSemicolon ? 2 : 1)] as ts.Node | undefined
    const stmtNode = lastStatementChild
      ? this.parseTsNode(child, hasSemicolon ? grandchildren.slice(0, -1) : grandchildren)
      : new TsNodeNode.for.EmptyStatement("")
    if(hasSemicolon)
      (stmtNode.children as Node[]).splice(stmtNode.children.length - 3, 2)
    nodes.push(new SyntaxListEntryNode(stmtNode))
    nodes.push(new SyntaxListSeparatorNode(this.finishTrivia([
      ...this.parseTriviaBetween(lastStatementChild, semicolonTsNode),
      new SemiNode(hasSemicolon),
      ...this.parseTriviaBetween(semicolonTsNode ?? lastStatementChild, children[i + 1]),
    ])))
  }
  return new SemiSyntaxListNode(nodes)
}

export class SemiSyntaxListNode extends SyntaxListNode {

  override _adaptTo(
    _selectedReferenceNode: this | null,
    selectedReferenceNodes: readonly this[],
    allReferenceNodes: readonly Node[],
  ): Node{
    const clone1 = this.clone()
    clone1.children = this.children.map(c =>
      c instanceof SyntaxListEntryNode
        ? c.adaptTo(selectedReferenceNodes.flatMap(c => c.children), allReferenceNodes)
        : c,
    )
    clone1._applyChildren()
    const clone2 = clone1.clone()
    clone2.children = clone1.children.map(c =>
      c instanceof SyntaxListEntryNode
        ? c
        : c.adaptTo(selectedReferenceNodes.flatMap(c => c.children), allReferenceNodes),
    )
    for(const c of clone1.children)
      c.parent = null
    clone2._applyChildren()
    return clone2
  }

}

const asiHazards = new Set("+-*/([`")
export class SemiNode extends Node {

  constructor(public present: boolean){
    super()
    this.filterGroup.addFilter(new FilterGroup({
      mode: "and",
      filters: [
        {
          filter(self, nodes){
            return nodes.filter(x => self.semiRequired ? x.semiRequired || x.present : !x.semiRequired)
          },
        },
        {
          filter(value, nodes){
            return nodes.filter(x => x.present === value.present)
          },
        },
      ],
    }))
  }

  get semiRequired(){
    const nextChar = this.findNextCousin(x => x instanceof TriviaNode ? "skip" : x.hasText)?.toString()[0]
    return !!nextChar && asiHazards.has(nextChar)
  }

  override toString(){
    return this.present || this.semiRequired ? ";" : ""
  }

  override get requireContext(){
    return true
  }

  override get hasText(){
    return this.present || this.semiRequired
  }

  override _adaptTo(node: this | null): Node{
    if(!node) return this
    const clone = this.clone()
    clone.present = node.present
    return clone
  }

}

