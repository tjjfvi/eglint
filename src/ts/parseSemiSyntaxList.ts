import ts, { Node } from "typescript"
import { ForkNode } from ".."
import { SyntaxListEntryNode, SyntaxListSeparatorNode, SyntaxListNode } from "./parseSyntaxList"
import { SourceFileNode } from "./SourceFileNode"
import { EmptyNode, TsNodeNode } from "./TsNodeNode"

const asiHazards = new Set("+-*/([`")

/* eslint-disable @typescript-eslint/no-non-null-assertion */
export function parseSemiSyntaxList(this: SourceFileNode, tsNode: ts.Node){
  const children = tsNode.getChildren()
  const nodes = []
  for(const [i, child] of children.entries()) {
    const grandchildren = child.getChildren()
    const hasSemicolon = grandchildren[grandchildren.length - 1]?.kind === ts.SyntaxKind.SemicolonToken
    const semicolonTsNode = hasSemicolon ? grandchildren[grandchildren.length - 1] : undefined
    const lastStatementChild = grandchildren[grandchildren.length - (hasSemicolon ? 2 : 1)] as ts.Node | undefined
    const nextChild = children[i + 1] as ts.Node | undefined
    const nextChildFirstChar = nextChild && this.source.slice(nextChild.getStart(this.sourceFile)).slice(0, 1)
    const optional = lastStatementChild && (false
            || !hasSemicolon
            || !nextChild
            || true
              && this.source.slice(lastStatementChild.end, nextChild.getStart(this.sourceFile)).includes("\n")
              && !asiHazards.has(nextChildFirstChar!)
    )
    const stmtNode = this.parseTsNode(child)
    if(hasSemicolon)
      (stmtNode.children as unknown as Node[]).splice(stmtNode.children.length - 3, 2)
    nodes.push(new SyntaxListEntryNode(stmtNode))
    nodes.push(new SyntaxListSeparatorNode(this.finishTrivia([
      this.parseTriviaBetween(lastStatementChild, semicolonTsNode),
      optional
        ? hasSemicolon
          ? new OptionalSemiNode(this.parseTsNode(semicolonTsNode!), [new EmptyNode()])
          : new OptionalSemiNode(
            new EmptyNode(),
            [new TsNodeNode.for.SemicolonToken(";")],
          )
        : this.parseTsNode(semicolonTsNode!),
      this.parseTriviaBetween(semicolonTsNode ?? lastStatementChild, children[i + 1]),
    ])))
  }
  return new SyntaxListNode(nodes)
}

export class OptionalSemiNode extends ForkNode {

  override get requireContext(){
    return true
  }

}

