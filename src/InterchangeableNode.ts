
import { Node } from "./Node"

export abstract class InterchangeableNode extends Node {

  override get priority(){
    return -1
  }

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
