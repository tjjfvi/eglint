import ts from "typescript"
import { ForkNode } from "../ForkNode"
import { IndentNode } from "../IndentNode"
import { ParameterListNode } from "./parseParameterList"
import { SourceFileNode } from "./SourceFileNode"
import { EmptyNode, TsNodeNode } from "./TsNodeNode"

export function parseArrowFunctionSig(this: SourceFileNode, tsChildren: ts.Node[]){
  // tsChildren can be one of:
  // - [ SyntaxList [ Parameter [ Identifier ] ] ]
  // - [ "(", SyntaxList[ ... ], ")" ]
  // - [ "(", SyntaxList[ ... ], ")", ":", <ReturnType> ]
  // - [ "<", SyntaxList[ ... ], ">", "(", SyntaxList[ ... ], ")" ]
  // - [ "<", SyntaxList[ ... ], ">", "(", SyntaxList[ ... ], ")", ":", <ReturnType> ]
  switch(tsChildren.length) {
    case 1: {
      const tsParameters = tsChildren[0].getChildren(this.sourceFile)
      const tsParameter = tsParameters[0]
      const tsParameterChildren = tsParameter.getChildren(this.sourceFile)
      const identifier = tsParameterChildren[0]
      const parsedSyntaxList = this.parseCommaSyntaxList(tsChildren[0] as ts.SyntaxList)
      return new SwappableArrowFunctionSigNode(
        this.retrieveParsedTsNode(identifier),
        new ArrowFunctionSigNode([
          new EmptyNode(),
          new ParameterListNode([
            new TsNodeNode.for.OpenParenToken("("),
            this.emptyTrivia(),
            parsedSyntaxList,
            this.emptyTrivia(),
            new TsNodeNode.for.OpenParenToken(")"),
            new IndentNode(0),
          ]),
          new EmptyNode(),
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
        new ArrowFunctionSigNode([
          new EmptyNode(),
          this.parseParameterList(tsChildren),
          new EmptyNode(),
          new IndentNode(0),
        ]),
        this.retrieveParsedTsNode(identifier),
      )
    }
  }
  switch(tsChildren.length) {
    case 3:
      return new ArrowFunctionSigNode(this.finishTrivia([
        new EmptyNode(),
        this.parseParameterList(tsChildren),
        new EmptyNode(),
      ]))
    case 5:
      return new ArrowFunctionSigNode(this.finishTrivia([
        new EmptyNode(),
        this.parseParameterList(tsChildren.slice(0, 3)),
        new ArrowFunctionReturnTypeAnnotation(this.finishTrivia([
          this.parseTriviaBetween(tsChildren[2], tsChildren[3]),
          ...this.parsePartialTsChildren(tsChildren.slice(3)),
        ])),
      ]))
    case 6:
      return new ArrowFunctionSigNode(this.finishTrivia([
        new ArrowFunctionTypeParameters(this.finishTrivia([
          this.parseTypeParameters(tsChildren.slice(0, 3)),
          this.parseTriviaBetween(tsChildren[2], tsChildren[3]),
        ])),
        this.parseParameterList(tsChildren.slice(3, 6)),
        new EmptyNode(),
      ]))
    case 8:
      return new ArrowFunctionSigNode(this.finishTrivia([
        new ArrowFunctionTypeParameters(this.finishTrivia([
          this.parseTypeParameters(tsChildren.slice(0, 3)),
          this.parseTriviaBetween(tsChildren[2], tsChildren[3]),
        ])),
        this.parseParameterList(tsChildren.slice(3, 6)),
        new ArrowFunctionReturnTypeAnnotation(this.finishTrivia([
          this.parseTriviaBetween(tsChildren[5], tsChildren[6]),
          ...this.parsePartialTsChildren(tsChildren.slice(6)),
        ])),
      ]))
    default:
      throw new Error("Invalid arrow function signature")
  }
}

export class SwappableArrowFunctionSigNode extends ForkNode {}

export class ArrowFunctionSigNode extends TsNodeNode {}
export class ArrowFunctionTypeParameters extends TsNodeNode {}
export class ArrowFunctionReturnTypeAnnotation extends TsNodeNode {}
