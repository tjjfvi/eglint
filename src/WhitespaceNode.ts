
import { Context, ContextProvider } from "./Context"
import { Node } from "./Node"
import { GroupNode } from "./GroupNode"

export class WhitespaceNode extends GroupNode<SpaceNode | NewlineNode> {

  _reconcileTo(node: Node): Node{
    if(node instanceof WhitespaceNode)
      return node
    return super._reconcileTo(node)
  }

}

export class SpaceNode extends Node {

  constructor(public count: number){
    super()
  }

  toString(){
    return " ".repeat(this.count)
  }

  $sameCount = 1
  $differentCount = .5

  _similarityTo(node: Node): number{
    if(node instanceof SpaceNode)
      return this.count === node.count ? this.$sameCount : this.$differentCount
    return super._similarityTo(node)
  }

  _reconcileTo(node: Node): Node{
    if(node instanceof SpaceNode)
      return node
    return super._reconcileTo(node)
  }

}

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
