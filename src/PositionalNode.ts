import { Node, NodeClass } from "./Node"
import { SingletonNode } from "./SingletonNode"

export abstract class PositionalNode<T extends Node> extends SingletonNode {

  abstract get childClass(): NodeClass<T>

  constructor(child: T){
    super(child)
  }

  positionalFilter = this.filterGroup.addFilter({
    required: "strong",
    filter(self, nodes){
      return nodes.filter(x => x.index === self.index)
    },
  })

  override get priority(){
    return this.childClass.prototype.priority
  }

  override get requireContext(){
    return true
  }

}
