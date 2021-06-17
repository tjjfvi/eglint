
import { Node } from "./Node"

export class InterchangeableNode extends Node {

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
    return node ?? this
  }

  override get requireContext(){
    return true
  }

}
