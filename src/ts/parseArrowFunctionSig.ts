import ts from "typescript"
import { ForkNode } from "../ForkNode"
import { SourceFileNode } from "./SourceFileNode"
import { TsNodeNode } from "./TsNodeNode"

export function parseArrowFunctionSig(this: SourceFileNode, tsChildren: ts.Node[]){
  // tsChildren can be one of:
  // - [ SyntaxList [ Parameter [ Identifier ] ] ]
  // - [ "(", SyntaxList[ ... ], ")" ]
  // - [ "(", SyntaxList[ ... ], ")", ":", <ReturnType> ]
  switch(tsChildren.length) {
    case 1: {
      const parameters = tsChildren[0].getChildren(this.sourceFile)
      const parameter = parameters[0]
      const parameterChildren = parameter.getChildren(this.sourceFile)
      const identifier = parameterChildren[0]
      return new SwappableArrowFunctionSigNode(
        this.parseTsNode(identifier),
        [new ArrowFunctionSigNode([
          new TsNodeNode.for.OpenParenToken("("),
          this.parseTsNode(tsChildren[0]),
          new TsNodeNode.for.OpenParenToken(")"),
        ])],
      )
    }
    case 3: {
      const parameters = tsChildren[1].getChildren(this.sourceFile)
      if(!parameters.length || parameters.length > 2)
        break
      const parameter = parameters[0]
      const parameterChildren = parameter.getChildren(this.sourceFile)
      if(parameterChildren.length !== 1)
        break
      // tsChildren must be [ "(", SyntaxList[ Parameter [ Identifier ], ","? ], ")" ]
      const identifier = parameterChildren[0]
      return new SwappableArrowFunctionSigNode(
        new ArrowFunctionSigNode(this.parseTsChildren(tsChildren)),
        [this.parseTsNode(identifier)],
      )
    }
    case 5:
      break
    default:
      throw new Error("Invalid arrow function signature")
  }
  return new ArrowFunctionSigNode(this.parseTsChildren(tsChildren))
}

export class SwappableArrowFunctionSigNode extends ForkNode {}

export class ArrowFunctionSigNode extends TsNodeNode {}
