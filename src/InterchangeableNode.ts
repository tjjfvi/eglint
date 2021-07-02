
import { Node } from "./Node"
import { Reference } from "./Reference"
import { Selection } from "./Selection"

export abstract class InterchangeableNode extends Node {

  constructor(...args: ConstructorParameters<typeof Node>){
    super(...args)
  }

  override get filterByChildren(){
    return false
  }

  override _adaptTo(_reference: Reference, selection: Selection<this>): Node{
    return selection.first()?.cloneDeep() ?? this
  }

  override get requireContext(){
    return true
  }

}
