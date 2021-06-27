
import { Node } from "./Node"

export abstract class InterchangeableNode extends Node {

  constructor(...args: ConstructorParameters<typeof Node>){
    super(...args)
  }

  override get filterByChildren(){
    return false
  }

  override _adaptTo(node: this | null): Node{
    return node?.cloneDeep() ?? this
  }

  override get requireContext(){
    return true
  }

}
