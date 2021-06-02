
import { Node } from "./Node"

export class NodeCollection {

  nodes: Node[] = []

  constructor(nodes: Node[])
  constructor(rootNode: Node)
  constructor(nodes: Node | Node[]){
    if(nodes instanceof Node)
      this._getAllChildrenDeep(nodes)
    else
      this.nodes = nodes
  }

  private _getAllChildrenDeep(node: Node){
    this.nodes.push(node)
    for(const child of node.getChildren())
      this._getAllChildrenDeep(child)
  }

  #findSimilarNodesMemo = new WeakMap<Node, Node[]>()
  findSimilarNodes(node: Node): Node[]{
    const existing = this.#findSimilarNodesMemo.get(node)
    if(existing) return existing
    const similarNodes = this.nodes.slice().sort((a, b) => node.similarityTo(b) - node.similarityTo(a))
    this.#findSimilarNodesMemo.set(node, similarNodes)
    return similarNodes
  }

}
