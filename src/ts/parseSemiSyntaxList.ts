import ts from "typescript"
import { InterchangeableNode } from "../InterchangeableNode"
import { propertyFilter } from "../propertyFilter"
import { getChildOfKind } from "./getChildOfKind"
import { SyntaxListEntryNode, SyntaxListSeparatorNode, SyntaxListNode } from "./parseSyntaxList"
import { SourceFileNode } from "./SourceFileNode"
import { TriviaNode } from "./trivia"
import { TsNodeNode } from "./TsNodeNode"

// All of the functions in this file also allow commas, for use in interfaces & object type literals

export function parseSemiSyntaxList(this: SourceFileNode, tsNode: ts.Node){
  const children = this.getChildren(tsNode)
  const nodes = []
  for(const [i, child] of children.entries()) {
    const semicolonTsNode = this.getSemi(child)
    const lastStatementChild = this.getLastNonSemiChild(child)
    const stmtNode = lastStatementChild
      ? this.parseStrippedStatement(child, this.getSemilessChildren(child))
      : new TsNodeNode.for.EmptyStatement("")
    nodes.push(new SyntaxListEntryNode(stmtNode))
    nodes.push(new SyntaxListSeparatorNode(this.finishTrivia([
      this.parseTriviaBetween(lastStatementChild, semicolonTsNode),
      this.parseSemi(semicolonTsNode),
      this.parseTriviaBetween(semicolonTsNode ?? lastStatementChild, children[i + 1]),
    ])))
  }
  return new SemiSyntaxListNode(nodes)
}

export function parseSemi(this: SourceFileNode, node: ts.Node | undefined){
  if(!node)
    return new SemiNode(null)
  this.getText(node) // Advance position
  return new SemiNode(node.kind === ts.SyntaxKind.SemicolonToken ? ";" : ",")
}

export function getSemi(this: SourceFileNode, tsNode: ts.Node){
  const children = this.getChildren(tsNode)
  return getChildOfKind(children, children.length - 1, ts.SyntaxKind.SemicolonToken, ts.SyntaxKind.CommaToken)
}

export function getSemilessChildren(this: SourceFileNode, tsNode: ts.Node){
  const children = this.getChildren(tsNode)
  if(this.getSemi(tsNode))
    return children.slice(0, -1)
  else
    return children
}

export function getLastNonSemiChild(this: SourceFileNode, tsNode: ts.Node){
  const semicolonlessChildren = this.getSemilessChildren(tsNode)
  return semicolonlessChildren[semicolonlessChildren.length - 1]
}

export class SemiSyntaxListNode extends SyntaxListNode {

  override get adaptStages(){
    return [SyntaxListEntryNode, SyntaxListSeparatorNode]
  }

}

const asiHazards = [..."+-*/([`"] // https://jsbench.me/aykqfs958p
export class SemiNode extends InterchangeableNode {

  constructor(public value: null | ";" | ","){
    super()
    this.filterGroup.addFilters([
      propertyFilter("semiRequired"),
      propertyFilter("value"),
    ])
  }

  get semiRequired(){
    const nextChar = this.findNextCousin(x => x instanceof TriviaNode ? "skip" : x.hasText)?.toString()[0]
    return !!nextChar && asiHazards.includes(nextChar)
  }

  override toString(){
    return this.value ?? (this.semiRequired ? ";" : "")
  }

  override get hasText(){
    return !!this.value || this.semiRequired
  }

  override get requireContext(){
    return true
  }

}

