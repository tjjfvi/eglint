import ts from "typescript"
import { IndentNode } from ".."
import { ForkNode } from "../ForkNode"
import { OptionalSemiNode } from "./parseSemiSyntaxList"
import { SyntaxListNode, SyntaxListEntryNode, SyntaxListSeparatorNode } from "./parseSyntaxList"
import { SourceFileNode } from "./SourceFileNode"
import { EmptyNode, TsNodeNode } from "./TsNodeNode"

export function parseArrowFunctionBody(this: SourceFileNode, bodyTsNode: ts.Node){
  const bodyNode = this.parseTsNode(bodyTsNode)
  const isBlock = bodyNode instanceof TsNodeNode.for(ts.SyntaxKind.Block)
  const swappable = !isBlock || (
    bodyNode.children[2].children.length === 1
    && bodyNode.children[2].children[0].children[0] instanceof TsNodeNode.for(ts.SyntaxKind.ReturnStatement)
  )
  if(!swappable)
    return bodyNode
  const resultNode = isBlock
    ? bodyNode.children[2].children[0].children[0].children[2]
    : bodyNode
  const alternative = isBlock
    ? resultNode
    : new (TsNodeNode.for(ts.SyntaxKind.Block))([
      new (TsNodeNode.for(ts.SyntaxKind.OpenBraceToken))("{"),
      this.spaceTrivia(),
      new SyntaxListNode([
        new SyntaxListEntryNode(new (TsNodeNode.for(ts.SyntaxKind.ReturnStatement))([
          new (TsNodeNode.for(ts.SyntaxKind.ReturnKeyword))("return"),
          this.spaceTrivia(),
          resultNode,
          new IndentNode(0),
        ])),
        new SyntaxListSeparatorNode([
          this.emptyTrivia(),
          new OptionalSemiNode(
            new EmptyNode(),
            [new (TsNodeNode.for(ts.SyntaxKind.SemicolonToken))(";")],
          ),
          this.emptyTrivia(),
          new IndentNode(0),
        ]),
      ]),
      this.spaceTrivia(),
      new (TsNodeNode.for(ts.SyntaxKind.OpenBraceToken))("}"),
      new IndentNode(0),
    ])
  return new SwappableArrowFunctionBody(bodyNode, [alternative])
}

export class SwappableArrowFunctionBody extends ForkNode {}
