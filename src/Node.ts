
import { cacheFn } from "./cacheFn"
import { ContextProvider } from "./Context"

export class Node {

  children: readonly Node[] = []

  constructor(args?: readonly Node[] | string){
    if(args instanceof Array)
      this.children = args
    else if(typeof args === "string")
      this.toString = () => args
  }

  // may be overriden by constructor
  toString(context: ContextProvider): string{
    let acc = ""
    for(const child of this.children)
      acc += child.toString(context)
    return acc
  }

  getAllNodes(array: Node[] = []): readonly Node[]{
    array.push(this)
    for(const child of this.children)
      child.getAllNodes(array)
    return array
  }

  protected compareClass = this.constructor as new (...args: any) => Node
  protected filterCompareClass: (nodes: readonly Node[]) => this[] = filterInstanceOf(this.compareClass) as never

  protected filter(referenceNodes: readonly this[]){
    return referenceNodes
  }

  adaptTo(selectedReferenceNodes: readonly Node[], allReferenceNodes: readonly Node[]): Node{
    let filteredNodes = this.filter(this.filterCompareClass(selectedReferenceNodes))
    if(!filteredNodes.length) {
      filteredNodes = this.filterCompareClass(allReferenceNodes)
      filteredNodes = nullifyEmptyArray(this.filter(filteredNodes)) ?? filteredNodes
    }
    if(!filteredNodes.length)
      return Node.prototype._adaptTo.call(this, null as never, filteredNodes, allReferenceNodes)
    return this._adaptTo(filteredNodes[0], filteredNodes, allReferenceNodes)
  }

  protected _adaptTo(
    selectedReferenceNode: this,
    selectedReferenceNodes: readonly this[],
    allReferenceNodes: readonly Node[],
  ): Node{
    selectedReferenceNode
    const adapted: Node = Object.create(Object.getPrototypeOf(this))
    Object.assign(adapted, this)
    adapted.children = this.children.map(c =>
      c.adaptTo(selectedReferenceNodes.flatMap(c => c.children), allReferenceNodes),
    )
    return adapted
  }

}

function nullifyEmptyArray<T>(array: readonly T[]){
  return array.length ? array : null
}

const filterInstanceOf = cacheFn(
  (ctor: new (...args: any) => Node) =>
    cacheFn(
      (nodes: readonly Node[]) =>
        nodes.filter(n => n instanceof ctor),
      new WeakMap(),
    ),
  new WeakMap(),
)
