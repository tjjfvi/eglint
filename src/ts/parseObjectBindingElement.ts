import ts from "typescript"
import { ForkNode } from "../ForkNode"
import { IndentNode } from "../IndentNode"
import { Node } from "../Node"
import { SourceFileNode } from "./SourceFileNode"
import { EmptyNode, TsNodeNode } from "./TsNodeNode"

const { ColonToken } = TsNodeNode.for

export function parseObjectBindingElement(this: SourceFileNode, tsNode: ts.Node): Node{
  const tsChildren = tsNode.getChildren()
  let [property, colon, binding, equals, fallback] = [] as Array<ts.Node | undefined>

  const buildBindingElement = (_assignments?: ts.Node[]): Node => {
    _assignments
    if(!property) throw new Error("Unreachable")
    return new ObjectBindingElement(this.finishTrivia([
      this.parseTsNode(property),
      buildAlias(),
      buildFallback(),
    ]))
  }

  const buildAlias = () => {
    if(!property) throw new Error("Unreachable")
    if(!colon || !binding)
      return new SwappableObjectBindingAlias(
        new EmptyNode(),
        new ObjectBindingAlias([
          ...this.emptyTrivia(),
          new ColonToken(":"),
          ...this.spaceTrivia(),
          this.retrieveParsedTsNode(property),
          new IndentNode(0),
        ]),
      )
    const baseAlias = new ObjectBindingAlias(this.finishTrivia([
      ...this.parseTriviaBetween(property, colon),
      this.parseTsNode(colon),
      ...this.parseTriviaBetween(colon, binding),
      this.parseBindingPattern(binding),
    ]))
    if(this.peekText(binding) !== this.peekText(property))
      return baseAlias
    return new SwappableObjectBindingAlias(
      baseAlias,
      new EmptyNode(),
    )
  }

  const buildFallback = () => {
    if(!property) throw new Error("Unreachable")
    if(!equals || !fallback) return new EmptyNode()
    return new ObjectBindingFallback(this.finishTrivia([
      ...this.parseTriviaBetween(binding ?? property, equals),
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
          //   <Property: Identifier>,
          // ]
          return buildBindingElement([property] = tsChildren)

        case 2:
          // BindingElement [
          //   "...",
          //   <Binding: Identifier>,
          // ]
          return new ObjectRestBindingElement(this.parseTsChildren(tsChildren))

        case 3:
          switch(tsChildren[1].kind) {
            case ts.SyntaxKind.ColonToken:
              // BindingElement [
              //   <Property: PropertyName>,
              //   ":",
              //   <Binding: Identifier or BindingPattern>,
              // ]
              return buildBindingElement([property, colon, binding] = tsChildren)

            case ts.SyntaxKind.EqualsToken:
              // BindingElement [
              //   <Property: Identifier>,
              //   "=",
              //   <Fallback: Expression>,
              // ]
              return buildBindingElement([property, equals, fallback] = tsChildren)

            default:
              throw new Error("Invalid object binding element")
          }

        case 5:
          // BindingElement [
          //   <Property: PropertyName>,
          //   ":",
          //   <Binding: Identifier or BindingPattern>,
          //   "=",
          //   <Fallback: Expression>,
          // ]
          return buildBindingElement([property, colon, binding, equals, fallback] = tsChildren)

        default:
          throw new Error("Invalid object binding element")
      }

    case ts.SyntaxKind.ShorthandPropertyAssignment:
      switch(tsChildren.length) {
        case 1:
          // ShorthandPropertyAssignment [
          //   <Property: Identifier>,
          // ]
          return buildBindingElement([property] = tsChildren)

        case 3:
          // ShorthandPropertyAssignment [
          //   <Property: Identifier>,
          //   "=",
          //   <Fallback: Expression>,
          // ]
          return buildBindingElement([property, equals, fallback] = tsChildren)

        default:
          throw new Error("Invalid object binding element")
      }

    case ts.SyntaxKind.PropertyAssignment:
      switch(tsChildren[2].kind) {
        case ts.SyntaxKind.BinaryExpression:
          // PropertyAssignment [
          //   <Property: PropertyName>,
          //   ":",
          //   BinaryExpression [
          //     <Binding: Identifier or BindingPattern or PropertyAccessExpression or ElementAccessExpression>,
          //     "=",
          //     <Fallback: Expression>,
          //   ]
          // ]
          [[property, colon], [binding, equals, fallback]] = [tsChildren, tsChildren[2].getChildren()]
          return buildBindingElement()

        default:
          // PropertyAssignment [
          //   <Property: PropertyName>,
          //   ":",
          //   <Binding: Identifier or BindingPattern or PropertyAccessExpression or ElementAccessExpression>,
          // ]
          return buildBindingElement([property, colon, binding] = tsChildren)
      }
    case ts.SyntaxKind.SpreadAssignment:
      // SpreadAssignment [
      //   "...",
      //   <Binding: Identifier or PropertyAccessExpression or ElementAccessExpression>,
      // ]
      return new ObjectRestBindingElement(this.finishTrivia([
        this.parseTsNode(tsChildren[0]),
        ...this.parseTriviaBetween(tsChildren[0], tsChildren[1]),
        this.parseBindingPattern(tsChildren[1]),
      ]))

    default:
      throw new Error("Invalid object binding element")
  }
}

export class ObjectRestBindingElement extends TsNodeNode {}
export class ObjectBindingElement extends TsNodeNode {}
export class ObjectBindingFallback extends TsNodeNode {}
export class ObjectBindingAlias extends TsNodeNode {}
export class SwappableObjectBindingAlias extends ForkNode {}
