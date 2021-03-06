import ts from "typescript"
import { Node } from "../Node"
import { propertyFilter } from "../propertyFilter"
import { relativePositionFilter } from "../relativePositionFilter"
import { SingletonNode } from "../SingletonNode"
import { SourceFileNode } from "./SourceFileNode"
import { TsNodeNode } from "./TsNodeNode"
import { syntaxKindName } from "./tsUtils"

export class SyntaxListNode extends TsNodeNode {

  constructor(children: Node[]){
    super(children as never)
  }

  override init(){
    super.init()
    this.filterGroup.addFilter({
      required: true,
      filter: propertyFilter("isEmpty"),
    })
  }

  get isEmpty(){
    return !!this.children.length
  }

  override get priority(){
    return .4
  }

  override get requireContext(){
    return true
  }

}

export class SyntaxListEntryNode extends SingletonNode {

  override get priority(){
    return .9
  }

  override get requireContext(){
    return true
  }

}

export class SyntaxListSeparatorNode extends Node {

  override init(){
    super.init()
    this.filterGroup.addFilter({
      priority: 1,
      required: true,
      filter: relativePositionFilter,
    })
  }

  override get requireContext(){
    return true
  }

}

export function parseSyntaxList(this: SourceFileNode, tsNode: ts.SyntaxList){
  switch(tsNode.parent.kind) {
    case ts.SyntaxKind.VariableDeclarationList:
    case ts.SyntaxKind.ArrayLiteralExpression:
    case ts.SyntaxKind.ObjectLiteralExpression:
    case ts.SyntaxKind.CallExpression:
    case ts.SyntaxKind.ArrayBindingPattern:
    case ts.SyntaxKind.NewExpression:
    case ts.SyntaxKind.NamedImports:
    case ts.SyntaxKind.NamedExports:
    case ts.SyntaxKind.EnumDeclaration:
    case ts.SyntaxKind.HeritageClause:
    case ts.SyntaxKind.TypeAliasDeclaration:
    case ts.SyntaxKind.TupleType:
    case ts.SyntaxKind.FunctionType:
    case ts.SyntaxKind.ConstructorType:
    case ts.SyntaxKind.TypeReference:
    case ts.SyntaxKind.ExpressionWithTypeArguments:
      return this.parseCommaSyntaxList(tsNode)
    case ts.SyntaxKind.Block:
    case ts.SyntaxKind.SourceFile:
    case ts.SyntaxKind.CaseClause:
    case ts.SyntaxKind.DefaultClause:
    case ts.SyntaxKind.TypeLiteral:
      return this.parseSemiSyntaxList(tsNode)
    case ts.SyntaxKind.CaseBlock:
      return new SyntaxListNode(
        this.getChildren(tsNode).flatMap((tsChild, i, tsChildren) => [
          this.parseTsNode(tsChild),
          this.parseTriviaBetween(tsChild, tsChildren[i + 1]),
        ]),
      )
    default:
      this.printTsNode(tsNode.parent)
      throw new Error("Unhandled SyntaxList Parent " + syntaxKindName(tsNode.parent.kind))
  }
}
