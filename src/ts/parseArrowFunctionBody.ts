import ts from "typescript"
import { IndentNode } from "../IndentNode"
import { ForkNode } from "../ForkNode"
import { OptionalSemiNode } from "./parseSemiSyntaxList"
import { SyntaxListNode, SyntaxListEntryNode, SyntaxListSeparatorNode } from "./parseSyntaxList"
import { SourceFileNode } from "./SourceFileNode"
import { EmptyNode, TsNodeNode } from "./TsNodeNode"
import { SingletonNode } from "../SingletonNode"

export function parseArrowFunctionBody(this: SourceFileNode, bodyTsNode: ts.Node){
  const bodyNode = this.parseTsNode(bodyTsNode)
  const isBlock = bodyNode instanceof TsNodeNode.for.Block
  const swappable = !isBlock || (
    bodyNode.children[2].children.length === 2
    && bodyNode.children[2].children[0].children[0] instanceof TsNodeNode.for.ReturnStatement
  )
  if(!swappable)
    return bodyNode
  const resultNode = isBlock
    ? bodyNode.children[2].children[0].children[0].children[2]
    : bodyNode
  const alternative = isBlock
    ? new ArrowFunctionExpressionBody(resultNode)
    : new TsNodeNode.for.Block([
      new TsNodeNode.for.OpenBraceToken("{"),
      this.spaceTrivia(),
      new SyntaxListNode([
        new SyntaxListEntryNode(new TsNodeNode.for.ReturnStatement([
          new TsNodeNode.for.ReturnKeyword("return"),
          this.spaceTrivia(),
          resultNode,
          new IndentNode(0),
        ])),
        new SyntaxListSeparatorNode([
          this.emptyTrivia(),
          new OptionalSemiNode(
            new EmptyNode(),
            [new TsNodeNode.for.SemicolonToken(";")],
          ),
          this.emptyTrivia(),
          new IndentNode(0),
        ]),
      ]),
      this.spaceTrivia(),
      new TsNodeNode.for.OpenBraceToken("}"),
      new IndentNode(0),
    ])
  if(isBlock)
    return new SwappableArrowFunctionBody(bodyNode, [alternative])
  else
    return new SwappableArrowFunctionBody(new ArrowFunctionExpressionBody(bodyNode), [alternative])
}

export class SwappableArrowFunctionBody extends ForkNode {}

export class ArrowFunctionExpressionBody extends SingletonNode {}
