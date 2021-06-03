import { SingletonNode } from "./SingletonNode"

export class PositionalNode extends SingletonNode {

  override filterIsOptional = false
  override filter(referenceNodes: readonly this[]){
    return referenceNodes.filter(x => x.index === this.index)
  }

}
