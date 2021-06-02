
import { Node } from "./Node"
import { NodeCollection } from "./NodeCollection"

export class GroupNode<T extends Node = Node> extends Node {

  constructor(
    public children: T[],
    public weights: number[] = Array.from({ length: children.length }, () => 1 / children.length),
  ){
    super()
    if(this.children.length !== this.weights.length)
      throw new Error("GroupNode must have the same number of weights and children")
    const weightSum = this.weights.reduce((a, b) => a + b, 0)
    if(weightSum !== 1)
      this.weights = this.weights.map(w => w / weightSum)
  }

  override getChildren(){
    return this.children
  }

  override _similarityTo(node: Node): number{
    if(node instanceof GroupNode && node.children.length === this.children.length)
      return this.children
        .map((c, i) =>
          c.similarityTo(node.children[i]) * (this.weights[i] + node.weights[i]) / 2,
        )
        .reduce((a, b) => a + b, 0)
    return super._similarityTo(node)
  }

  override _adaptTo(reference: NodeCollection, node: Node): Node | null{
    if(node instanceof GroupNode && node.children.length === this.children.length) {
      const adaptedChildren = this.children.map((c, i) => c.adaptTo(reference, node.children[i]))
      // console.log(adaptedChildren)
      if(!adaptedChildren.every(x => x === null))
        return new GroupNode(adaptedChildren.map((c, i) =>
          c ?? Object.assign(this.children[i], { metadata: "unchanged" }),
        ), this.weights)
    }
    return super._adaptTo(reference, node)
  }

}
