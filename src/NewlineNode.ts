import { Context, ContextProvider } from "./Context"
import { WhitespaceNode } from "./WhitespaceNode"

export class NewlineNode extends WhitespaceNode {

  constructor(public deltaIndent: number){
    super()
  }

  override toString(contextProvider: ContextProvider){
    const indentation = contextProvider.getContext(IndentationContext)
    indentation.level += this.deltaIndent
    return "\n" + indentation
  }

}

class IndentationContext extends Context {

  level = 0

  override toString(){
    if(this.level < 0)
      return "!!".repeat(-this.level)
    return "  ".repeat(this.level)
  }

}
