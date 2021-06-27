import ts from "typescript"
import { InterchangeableNode } from "../InterchangeableNode"
import { Node } from "../Node"
import { propertyFilter } from "../propertyFilter"
import { SyntaxListEntryNode, SyntaxListSeparatorNode, SyntaxListNode } from "./parseSyntaxList"
import { SourceFileNode } from "./SourceFileNode"
import { TriviaNode } from "./trivia"
import { TsNodeNode } from "./TsNodeNode"

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

  override get adaptStages(){
    return [SyntaxListEntryNode, SyntaxListSeparatorNode]
  }

}

const asiHazards = [..."+-*/([`"] // https://jsbench.me/aykqfs958p
export class SemiNode extends InterchangeableNode {

  constructor(public present: boolean){
    super()
    this.filterGroup.addFilters([
      propertyFilter("semiRequired"),
      propertyFilter("present"),
    ])
  }

  get semiRequired(){
    const nextChar = this.findNextCousin(x => x instanceof TriviaNode ? "skip" : x.hasText)?.toString()[0]
    return !!nextChar && asiHazards.includes(nextChar)
  }

  override toString(){
    return this.present || this.semiRequired ? ";" : ""
  }

  override get hasText(){
    return this.present || this.semiRequired
  }

  override get requireContext(){
    return true
  }

}

