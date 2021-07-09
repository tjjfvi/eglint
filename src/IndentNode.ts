import { Context, ContextProvider } from "./Context"
import { InterchangeableNode } from "./InterchangeableNode"

export class IndentNode extends InterchangeableNode {

  constructor(public deltaIndent: number){
    super()
  }

  override toString(contextProvider = new ContextProvider()){
    const indentation = contextProvider.getContext(IndentationContext)
    indentation.level += this.deltaIndent
    return ""
  }

}

export class IndentationContext extends Context {

  level = 0
  indent = "  "

  override toString(){
    if(this.level < 0)
      throw new Error("Invalid indent level " + this.level)
    return this.indent.repeat(this.level)
  }

}
