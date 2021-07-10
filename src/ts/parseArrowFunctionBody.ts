import ts from "typescript"
import { IndentNode } from "../IndentNode"
import { ForkNode } from "../ForkNode"
import { SemiNode } from "./parseSemiSyntaxList"
import { SyntaxListNode, SyntaxListEntryNode, SyntaxListSeparatorNode } from "./parseSyntaxList"
import { SourceFileNode } from "./SourceFileNode"
import { TsNodeNode } from "./TsNodeNode"
import { SingletonNode } from "../SingletonNode"

const { Block, OpenBraceToken, CloseBraceToken, ReturnStatement, ReturnKeyword } = TsNodeNode.for

export function parseArrowFunctionBody(this: SourceFileNode, bodyTsNode: ts.Node){
  if(bodyTsNode.kind !== ts.SyntaxKind.Block) {
    // bodyTsNode is an expression
    let expression
    return new SwappableArrowFunctionBody(
      new ArrowFunctionExpressionBody(expression = this.parseTsNode(bodyTsNode)),
      new Block([
        new OpenBraceToken("{"),
        this.spaceTrivia(),
        new SyntaxListNode([
          new SyntaxListEntryNode(new ReturnStatement([
            new ReturnKeyword("return"),
            this.spaceTrivia(),
            expression,
            new IndentNode(0),
          ])),
          new SyntaxListSeparatorNode([
            this.emptyTrivia(),
            new SemiNode(null),
            this.emptyTrivia(),
            new IndentNode(0),
          ]),
        ]),
        this.spaceTrivia(),
        new CloseBraceToken("}"),
        new IndentNode(0),
      ]),
    )
  }

  const tsSyntaxList = bodyTsNode.getChildren()[1]
  const tsStatements = tsSyntaxList.getChildren()
  if(tsStatements.length !== 1 || tsStatements[0].kind !== ts.SyntaxKind.ReturnStatement)
    return this.parseTsNode(bodyTsNode)
  // bodyTsNode is
  // Block [
  //   "{",
  //   SyntaxList [
  //     ReturnStatement [
  //       "return",
  //       <Expression>,
  //       ";"?,
  //     ]
  //   ]
  //   "}",
  // ]
  const tsReturnStatement = tsStatements[0]
  const tsExpression = tsReturnStatement.getChildren()[1]
  return new SwappableArrowFunctionBody(
    this.parseTsNode(bodyTsNode),
    new ArrowFunctionExpressionBody(this.retrieveParsedTsNode(tsExpression)),
  )
}

export class SwappableArrowFunctionBody extends ForkNode {}

export class ArrowFunctionExpressionBody extends SingletonNode {}
