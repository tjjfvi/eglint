import ts from "typescript"
import { Node } from "../Node"
import { SourceFileNode } from "./SourceFileNode"
import { EmptyNode, TsNodeNode } from "./TsNodeNode"

export function parseArrayBindingElement(this: SourceFileNode, tsNode: ts.Node): Node{
  const tsChildren = tsNode.getChildren()
  let [binding, equals, fallback] = [] as Array<ts.Node | undefined>

  const buildBindingElement = (_assignments?: ts.Node[]): Node => {
    _assignments
    if(!binding) throw new Error("Unreachable")
    return new ArrayBindingElement(this.finishTrivia([
      this.parseBindingPattern(binding),
      buildFallback(),
    ]))
  }

  const buildFallback = () => {
    if(!binding) throw new Error("Unreachable")
    if(!equals || !fallback) return new EmptyNode()
    return new ArrayBindingFallback(this.finishTrivia([
      ...this.parseTriviaBetween(binding, equals),
      this.parseTsNode(equals),
      ...this.parseTriviaBetween(equals, fallback),
      this.parseTsNode(fallback),
    ]))
  }

  switch(tsNode.kind) {
    case ts.SyntaxKind.BindingElement:
      switch(tsNode.getChildren().length) {
        case 1:
          // BindingElement [
          //   <Binding>,
          // ]
          return buildBindingElement([binding] = tsChildren)

        case 2:
          // BindingElement [
          //   "...",
          //   <Binding>,
          // ]
          return new ArrayRestBindingElement(this.finishTrivia([
            this.parseTsNode(tsChildren[0]),
            ...this.parseTriviaBetween(tsChildren[0], tsChildren[1]),
            this.parseBindingPattern(tsChildren[1]),
          ]))

        case 3:
          // BindingElement [
          //   <Binding>,
          //   "=",
          //   <Fallback: Expression>,
          // ]
          return buildBindingElement([binding, equals, fallback] = tsChildren)

        default:
          throw new Error("Invalid array binding element")
      }

    case ts.SyntaxKind.BinaryExpression:
      // BinaryExprrssion [
      //   <Binding>,
      //   "=",
      //   <Fallback: Expression>,
      // ]
      return buildBindingElement([binding, equals, fallback] = tsChildren)

    case ts.SyntaxKind.SpreadElement:
      // SpreadElement [
      //   "...",
      //   <Binding>,
      // ]
      return new ArrayRestBindingElement(this.finishTrivia([
        this.parseTsNode(tsChildren[0]),
        ...this.parseTriviaBetween(tsChildren[0], tsChildren[1]),
        this.parseBindingPattern(tsChildren[1]),
      ]))

    default:
      // <Binding>
      return buildBindingElement([binding] = [tsNode])
  }
}

export class ArrayRestBindingElement extends TsNodeNode {}
export class ArrayBindingElement extends TsNodeNode {}
export class ArrayBindingFallback extends TsNodeNode {}
