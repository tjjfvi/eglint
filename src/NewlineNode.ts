import { ContextProvider } from "./Context"
import { IndentationContext } from "./IndentNode"
import { InterchangeableNode } from "./InterchangeableNode"

export class NewlineNode extends InterchangeableNode {

  constructor(public count: number, public deltaIndent: number){
    super()
  }

  override toString(contextProvider = new ContextProvider()){
    const indentation = contextProvider.getContext(IndentationContext)
    indentation.level += this.deltaIndent
    return "\n".repeat(this.count) + indentation
  }

  override get hasText(){
    return true
  }

}
