import { Node } from "./Node"
import { SingletonNode } from "./SingletonNode"

export class PositionalNode extends SingletonNode {

  constructor(child: Node){
    super(child)
    this.priority = child.priority
  }

  override filterIsOptional = false
  override filter(referenceNodes: readonly this[]){
    return referenceNodes.filter(x => x.index === this.index)
  }

  override select(selectedReferenceNodes: readonly Node[]){
    return this.filter(this.filterCompareClass(selectedReferenceNodes))
  }

}
