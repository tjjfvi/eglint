import ts from "typescript"
import { ForkNode } from "../ForkNode"
import { IndentNode } from "../IndentNode"
import { Node } from "../Node"
import { SemiSyntaxListNode } from "./parseSemiSyntaxList"
import { SyntaxListEntryNode, SyntaxListSeparatorNode } from "./parseSyntaxList"
import { SourceFileNode } from "./SourceFileNode"
import { TsNodeNode } from "./TsNodeNode"

export function parseStatement(this: SourceFileNode, tsNode: ts.Node, forceUnswappable = false): Node{
  const tsChildren = tsNode.getChildren(this.sourceFile)
  if(tsNode.kind === ts.SyntaxKind.Block) {
    const tsSyntaxList = tsChildren[1]
    const tsStatements = tsSyntaxList.getChildren(this.sourceFile)
    if(tsStatements.length !== 1 || forceUnswappable)
      return new LoneBlockNode(this.parseTsChildren(tsChildren))
    const [tsStatement] = tsStatements
    let statement, semiChildren
    return new SwappableBlockNode(
      new LoneBlockNode(this.finishTrivia([
        this.parseTsNode(tsChildren[0]),
        ...this.parseTriviaBetween(tsChildren[0], tsChildren[1]),
        new SemiSyntaxListNode([
          new SyntaxListEntryNode(
            statement = this.parseStrippedStatement(tsStatement, this.getSemilessChildren(tsStatement)),
          ),
          new SyntaxListSeparatorNode(semiChildren = this.finishTrivia([
            ...this.parseTriviaBetween(this.getLastNonSemiChild(tsStatement), this.getSemi(tsStatement)),
            this.parseSemi(this.getSemi(tsStatement)),
            ...this.emptyTrivia(),
          ])),
        ]),
        ...this.parseTriviaBetween(tsChildren[1], tsChildren[2]),
        this.parseTsNode(tsChildren[2]),
      ])),
      [new LoneStatementNode([statement, ...semiChildren])],
    )
  }
  let statement, semiChildren
  const base = new LoneStatementNode([
    statement = this.parseStrippedStatement(tsNode, this.getSemilessChildren(tsNode)),
    ...semiChildren = this.finishTrivia([
      ...this.parseTriviaBetween(this.getLastNonSemiChild(tsNode), this.getSemi(tsNode)),
      this.parseSemi(this.getSemi(tsNode)),
      ...this.emptyTrivia(),
    ]),
  ])
  if(forceUnswappable)
    return base
  return new SwappableBlockNode(
    base,
    [new LoneBlockNode([
      new TsNodeNode.for.OpenBraceToken("{"),
      ...this.emptyTrivia(),
      new SemiSyntaxListNode([
        new SyntaxListEntryNode(statement),
        new SyntaxListSeparatorNode(semiChildren),
      ]),
      ...this.emptyTrivia(),
      new TsNodeNode.for.CloseBraceToken("}"),
      new IndentNode(0),
    ])],
  )
}

export class LoneStatementNode extends TsNodeNode {}

export class LoneBlockNode extends TsNodeNode {

  override get required(): "weak"{
    return "weak"
  }

}

export class SwappableBlockNode extends ForkNode {

  override get required(): "weak"{
    return "weak"
  }

}
