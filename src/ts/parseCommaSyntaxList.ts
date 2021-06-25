import ts, { SyntaxList } from "typescript"
import { ForkNode } from "../ForkNode"
import { SyntaxListSeparatorNode, SyntaxListEntryNode, SyntaxListNode } from "./parseSyntaxList"
import { SourceFileNode } from "./SourceFileNode"
import { EmptyNode, TsNodeNode } from "./TsNodeNode"

export function parseCommaSyntaxList(this: SourceFileNode, tsNode: SyntaxList){
  const children = tsNode.getChildren()
  const nodes = []
  for(const [i, child] of children.entries())
    if(child.kind === ts.SyntaxKind.CommaToken)
      nodes.push(new SyntaxListSeparatorNode(this.finishTrivia([
        ...this.parseTriviaBetween(children[i - 1], child),
        i === children.length - 1
          ? new TrailingCommaNode(this.parseTsNode(child), [new EmptyNode()])
          : this.parseTsNode(child),
        ...this.parseTriviaBetween(child, children[i + 1]),
      ])))
    else
      nodes.push(new SyntaxListEntryNode(this.parseTsNode(child)))
  if(children.length && children[children.length - 1].kind !== ts.SyntaxKind.CommaToken)
    nodes.push(new SyntaxListSeparatorNode(this.finishTrivia([
      ...this.emptyTrivia(),
      new TrailingCommaNode(new EmptyNode(), [new TsNodeNode.for.CommaToken(",")]),
      ...this.emptyTrivia(),
    ])))
  return new SyntaxListNode(nodes)
}

export class TrailingCommaNode extends ForkNode {

  override get requireContext(){
    return true
  }

}

