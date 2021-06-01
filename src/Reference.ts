
import { Node } from "./Node"

export class Reference {

  allNodes: Node[] = []

  constructor(public rootNode: Node){
    this._getAllChildren(rootNode)
  }

  private _getAllChildren(node: Node){
    this.allNodes.push(node)
    for(const child of node.getChildren())
      this._getAllChildren(child)
  }

  #findSimilarNodesMemo = new WeakMap<Node, Node[]>()
  findSimilarNodes(node: Node): Node[]{
    const existing = this.#findSimilarNodesMemo.get(node)
    if(existing) return existing
    const similarNodes = this.allNodes.sort((a, b) => b.similarityTo(node) - a.similarityTo(node))
    this.#findSimilarNodesMemo.set(node, similarNodes)
    return similarNodes
  }

}
