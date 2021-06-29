import ts from "typescript"
import { ForkNode } from "../ForkNode"
import { IndentNode } from "../IndentNode"
import { SourceFileNode } from "./SourceFileNode"
import { TsNodeNode } from "./TsNodeNode"

export function parseArrowFunctionSig(this: SourceFileNode, tsChildren: ts.Node[]){
  // tsChildren can be one of:
  // - [ SyntaxList [ Parameter [ Identifier ] ] ]
  // - [ "(", SyntaxList[ ... ], ")" ]
  // - [ "(", SyntaxList[ ... ], ")", ":", <ReturnType> ]
  switch(tsChildren.length) {
    case 1: {
      const tsParameters = tsChildren[0].getChildren(this.sourceFile)
      const tsParameter = tsParameters[0]
      const tsParameterChildren = tsParameter.getChildren(this.sourceFile)
      const identifier = tsParameterChildren[0]
      const parsedSyntaxList = this.parseTsNode(tsChildren[0])
      return new SwappableArrowFunctionSigNode(
        this.retrieveParsedTsNode(identifier),
        new ArrowFunctionSigNode([
          new TsNodeNode.for.OpenParenToken("("),
          ...this.emptyTrivia(),
          parsedSyntaxList,
          ...this.emptyTrivia(),
          new TsNodeNode.for.OpenParenToken(")"),
          new IndentNode(0),
        ]),
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
        this.retrieveParsedTsNode(identifier),
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
