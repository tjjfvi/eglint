
import { ContextProvider } from "./Context"
import { Node } from "./Node"

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

  toString(context: ContextProvider){
    let acc = ""
    for(const child of this.children)
      acc += child.toString(context)
    return acc
  }

  _similarityTo(node: Node): number{
    if(node instanceof GroupNode && node.children.length === this.children.length)
      return this.children
        .map((c, i) =>
          c.similarityTo(node.children[i]) * (this.weights[i] + node.weights[i]) / 2,
        )
        .reduce((a, b) => a + b, 0)
    return super._similarityTo(node)
  }

  _reconcileTo(node: Node): Node{
    if(node instanceof GroupNode && node.children.length === this.children.length)
      return new GroupNode(this.children.map((c, i) => c.reconcileTo(node.children[i])), this.weights)
    return super._reconcileTo(node)
  }

}
