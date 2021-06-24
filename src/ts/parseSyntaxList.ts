import ts from "typescript"
import { SingletonNode } from ".."
import { RelativePositionalNode } from "../RelativePositionalNode"
import { SourceFileNode } from "./SourceFileNode"
import { TsNodeNode } from "./TsNodeNode"
import { syntaxKindName } from "./tsUtils"

export class SyntaxListNode extends TsNodeNode {

  isEmptyFilter = this.filterGroup.addFilter({
    required: "strong",
    filter(self, nodes){
      return nodes.filter(x => !!x.children.length === !!self.children.length)
    },
  })

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

export class SyntaxListSeparatorNode extends RelativePositionalNode {

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
    case ts.SyntaxKind.ArrowFunction:
    case ts.SyntaxKind.ArrayBindingPattern:
      return this.parseCommaSyntaxList(tsNode)
    case ts.SyntaxKind.Block:
    case ts.SyntaxKind.SourceFile:
      return this.parseSemiSyntaxList(tsNode)
    default:
      throw new Error("Unhandled SyntaxList Parent " + syntaxKindName(tsNode.parent.kind))
  }
}
