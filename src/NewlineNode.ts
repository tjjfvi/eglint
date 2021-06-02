
import { ContextProvider, Context } from "./Context"
import { Node } from "./Node"
import { NodeCollection } from "./NodeCollection"

export class NewlineNode extends Node {

  constructor(public deltaIndent: number){
    super()
  }

  override toString(context: ContextProvider){
    const indentation = context.getContext(IndentContext)
    indentation.level += this.deltaIndent
    return "\n" + indentation
  }

  $sameIndentation = 1
  $differentIndentation = .5

  override _similarityTo(node: Node): number{
    if(node instanceof NewlineNode)
      return this.deltaIndent === node.deltaIndent ? this.$sameIndentation : this.$differentIndentation
    return super._similarityTo(node)
  }

  override _adaptTo(reference: NodeCollection, node: Node): Node | null{
    if(node instanceof NewlineNode)
      return node
    return super._adaptTo(reference, node)
  }

}

export class IndentContext extends Context {

  level = 0

  override toString(){
    if(this.level < 0)
      return "!!".repeat(-this.level)
    return "  ".repeat(this.level)
  }

}
