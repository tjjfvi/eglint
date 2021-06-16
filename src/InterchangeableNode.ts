
import { Node } from "./Node"

export class InterchangeableNode extends Node {

  override priority = -1

  constructor(...args: ConstructorParameters<typeof Node>){
    super(...args)
    this.filterGroup.filters = [] // Don't filter on children
  }

  override _adaptTo(node: this | null): Node{
    return node ?? this
  }

  override requireContext = true

}
