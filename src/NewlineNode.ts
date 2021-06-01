
import { ContextProvider, Context } from "./Context"
import { Node } from "./Node"

export class NewlineNode extends Node {

  constructor(public deltaIndent: number){
    super()
  }

  toString(context: ContextProvider){
    const indentation = context.getContext(IndentContext)
    indentation.level += this.deltaIndent
    return "\n" + indentation
  }

  $sameIndentation = 1
  $differentIndentation = .5

  _similarityTo(node: Node): number{
    if(node instanceof NewlineNode)
      return this.deltaIndent === node.deltaIndent ? this.$sameIndentation : this.$differentIndentation
    return super._similarityTo(node)
  }

  _reconcileTo(node: Node): Node{
    if(node instanceof NewlineNode)
      return node
    return super._reconcileTo(node)
  }

}

export class IndentContext extends Context {

  level = 0

  toString(){
    return "  ".repeat(this.level)
  }

}
