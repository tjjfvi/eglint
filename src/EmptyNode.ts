import { Node } from "./Node"

export class EmptyNode extends Node {

  toString(){
    return ""
  }

  $nonEmpty = .5

  _similarityTo(node: Node){
    if(node instanceof EmptyNode) return 1
    return this.$nonEmpty
  }

  _similarityFrom(){
    return this.$nonEmpty
  }

}
