import { Node } from "./Node"
import { NodeCollection } from "./NodeCollection"

export class ListNode<T extends Node = Node> extends Node {

  nodeCollection = new NodeCollection(this.children)

  constructor(public children: T[]){
    super()
  }

  override getChildren(){
    return this.children
  }

  $bothEmpty = 1
  $oneEmpty = 0

  override _similarityTo(node: Node): number{
    if(node instanceof ListNode) {
      if(this.children.length === 0 && node.children.length === 0)
        return this.$bothEmpty
      if(this.children.length === 0 || node.children.length === 0)
        return this.$oneEmpty
      const x = this.children
        .map(c => c.similarityTo(node.nodeCollection.findSimilarNodes(c)[0]))
        .reduce((a, b) => a + b / this.children.length, 0)
      // console.log(x)
      return x
    }
    return super._similarityTo(node)
  }

  override _adaptTo(reference: NodeCollection, node: Node): Node | null{
    if(node instanceof ListNode) {
      // console.log(this, node, node.nodeCollection)
      if(this.children.length === 0 && node.children.length === 0)
        return this
      if(this.children.length !== 0 && node.children.length !== 0) {
        const adaptedChildren = this.children.map(c => c.adaptToMultiple(reference, node.nodeCollection))
        // console.log(adaptedChildren)
        if(!adaptedChildren.every(x => x === null))
          return new ListNode(adaptedChildren.map((c, i) =>
            c ?? Object.assign(this.children[i], { metadata: "unchanged" }),
          ))
      }
    }
    return super._adaptTo(reference, node)
  }

}
