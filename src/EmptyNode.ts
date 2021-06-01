import { Node } from "./Node"

export class EmptyNode extends Node {

  $nonEmpty = .5

  override _similarityTo(node: Node){
    if(node instanceof EmptyNode) return 1
    return this.$nonEmpty
  }

}
