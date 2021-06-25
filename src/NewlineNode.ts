import { ContextProvider } from "./Context"
import { IndentationContext } from "./IndentNode"
import { InterchangeableNode } from "./InterchangeableNode"

export class NewlineNode extends InterchangeableNode {

  constructor(public deltaIndent: number){
    super()
  }

  override toString(contextProvider = new ContextProvider()){
    const indentation = contextProvider.getContext(IndentationContext)
    indentation.level += this.deltaIndent
    return "\n" + indentation
  }

}
