import ts from "typescript"
import { SourceFileNode } from "./SourceFileNode"
import { EmptyNode, TsNodeNode } from "./TsNodeNode"

export function parseForLoop(this: SourceFileNode, tsNode: ts.Node, tsChildren: ts.Node[]){
  // tsChildren is
  // [
  //   "for",
  //   "(",
  //   <Initializer>?,
  //   ";",
  //   <Condition>?,
  //   ";",
  //   <Increment>?,
  //   ")",
  //   <Body>,
  // ]

  const firstSemiIndex = tsChildren.findIndex(x => x.kind === ts.SyntaxKind.SemicolonToken)
  const secondSemiIndex = tsChildren.findIndex((x, i) => i > firstSemiIndex && x.kind === ts.SyntaxKind.SemicolonToken)
  const closeParenIndex = tsChildren.findIndex(x => x.kind === ts.SyntaxKind.CloseParenToken)

  if(firstSemiIndex === -1 || secondSemiIndex === -1 || closeParenIndex === -1)
    throw new Error("Invalid for loop")

  const initializer = getLoopPart(firstSemiIndex - 1)
  const firstSemi = tsChildren[firstSemiIndex]
  const condition = getLoopPart(secondSemiIndex - 1)
  const secondSemi = tsChildren[secondSemiIndex]
  const increment = getLoopPart(closeParenIndex - 1)
  const closeParen = tsChildren[closeParenIndex]
  const body = tsChildren[closeParenIndex + 1]

  return new TsNodeNode.for.ForStatement(this.finishTrivia([
    ...this.parsePartialTsChildren(tsChildren.slice(0, 2)),
    ...this.parseTriviaBetween(tsChildren[1], initializer ?? firstSemi),
    initializer ? this.parseTsNode(initializer) : new EmptyNode(),
    ...this.parseTriviaBetween(initializer, firstSemi),
    this.parseTsNode(firstSemi),
    ...this.parseTriviaBetween(firstSemi, condition ?? secondSemi),
    condition ? this.parseTsNode(condition) : new EmptyNode(),
    ...this.parseTriviaBetween(condition, secondSemi),
    this.parseTsNode(secondSemi),
    ...this.parseTriviaBetween(secondSemi, increment ?? closeParen),
    increment ? this.parseTsNode(increment) : new EmptyNode(),
    ...this.parseTriviaBetween(increment, closeParen),
    this.parseTsNode(closeParen),
    ...this.parseTriviaBetween(closeParen, body),
    this.parseStatement(body),
  ]))

  function getLoopPart(index: number){
    const part = tsChildren[index]
    return ts.isToken(part) ? undefined : part
  }
}
