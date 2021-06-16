import { Node } from "./Node"
import { SingletonNode } from "./SingletonNode"

export class PositionalNode extends SingletonNode {

  constructor(child: Node){
    super(child)
    this.priority = child.priority
  }

  positionalFilter = this.filterGroup.addFilter({
    priority: 10,
    optional: false,
    filter(self, nodes){
      return nodes.filter(x => x.index === self.index)
    },
  })

  override requireContext = true

}
