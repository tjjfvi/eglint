import ts from "typescript"
import { LoneStatementNode, SwappableBlockNode } from "./parseStatement"
import { SourceFileNode } from "./SourceFileNode"
import { TsNodeNode } from "./TsNodeNode"

export function parseIfStatement(
  this: SourceFileNode,
  tsNode: ts.Node,
  // Has semicolon sliced off if present
  tsChildren: ts.Node[],
){
  // tsChildren is one of
  // - [
  //     "if",
  //     "(",
  //     <Condition>,
  //     ")",
  //     <Body: Block or Statement>
  //   ]
  // - [
  //     "if",
  //     "(",
  //     <Condition>,
  //     ")",
  //     <Body: Block or Statement>
  //     "else",
  //     <Body: Block or Statement>
  //   ]
  switch(tsChildren.length) {
    case 5:
      return new IfStatement(this.finishTrivia([
        ...this.parsePartialTsChildren(tsChildren.slice(0, 4)),
        this.parseTriviaBetween(tsChildren[3], tsChildren[4]),
        this.parseStatement(tsChildren[4]),
      ]))
    case 7: {
      // If an if-else statement looks like this, removing the braces on the if will
      // mean that the `else qux` branch is associated with the inner if.
      // ```ts
      // if(foo) {
      //   if(bar)
      //     baz
      // }
      // else
      //   qux
      // ```
      const forceUnswappable = true
        && tsChildren[4].kind === ts.SyntaxKind.Block
        && this.getChildren(this.getChildren(tsChildren[4])[1]).length === 1
        && this.getChildren(this.getChildren(tsChildren[4])[1])[0].kind === ts.SyntaxKind.IfStatement
        && this.getChildren(this.getChildren(this.getChildren(tsChildren[4])[1])[0])[5]?.kind
        !== ts.SyntaxKind.ElseKeyword
      return new IfElseStatement(this.finishTrivia([
        new IfStatement(this.finishTrivia([
          ...this.parsePartialTsChildren(tsChildren.slice(0, 4)),
          this.parseTriviaBetween(tsChildren[3], tsChildren[4]),
          this.parseStatement(tsChildren[4], forceUnswappable),
        ])),
        this.parseTriviaBetween(tsChildren[4], tsChildren[5]),
        this.parseElseStatement(tsChildren.slice(5)),
      ]))
    }
    default:
      this.printTsNode(tsNode)
      for(const x of tsChildren)
        this.printTsNode(x)
      throw new Error("Invalid if statement")
  }
}

export function parseElseStatement(this: SourceFileNode, tsChildren: ts.Node[]){
  // tsChildren is [ "else", <Body> ]
  const elseAndTrivia = [
    this.parseTsNode(tsChildren[0]),
    this.parseTriviaBetween(tsChildren[0], tsChildren[1]),
  ]
  const body = this.parseStatement(tsChildren[1])
  const isElseIf = true
    && body instanceof SwappableBlockNode
    && body.allOptions.some(x => true
      && x instanceof LoneStatementNode
      && (false
        || x.children[0] instanceof IfStatement
        || x.children[0] instanceof IfElseStatement
      ),
    )
  return new (isElseIf ? ElseIfStatement : ElseStatement)(this.finishTrivia([
    ...elseAndTrivia,
    body,
  ]))
}

export class IfStatement extends TsNodeNode {}
export class ElseStatement extends TsNodeNode {}
export class ElseIfStatement extends TsNodeNode {}
export class IfElseStatement extends TsNodeNode {}
