import { Node } from "./Node"

export abstract class PositionalNode extends Node {

  positionalFilter = this.filterGroup.addFilter({
    required: "strong",
    filter(self, nodes){
      return nodes.filter(x => x.index === self.index)
    },
  })

  override get requireContext(){
    return true
  }

}
