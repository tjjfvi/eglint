
import { cacheFn } from "./cacheFn"
import { ContextProvider } from "./Context"

let idN = 0

export class Node {

  static priority = 0

  id = idN++
  children: readonly Node[] = []
  parent: Node | null = null
  index = -1

  constructor(args?: readonly Node[] | string){
    if(args instanceof Array)
      this.children = args
    else if(typeof args === "string")
      this.toString = () => args
    this._applyChildren()
  }

  private _applyChildren(){
    for(const [i, child] of this.children.entries()) {
      if(child.parent)
        throw new Error("Child passed to node already has a parent")
      child.parent = this
      child.index = i
    }
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

  protected compareClass = this.constructor as (new (...args: any) => Node) & Omit<typeof Node, never>
  protected filterCompareClass: (nodes: readonly Node[]) => this[] = filterInstanceOf(this.compareClass) as never

  filterIsOptional = true
  protected filter(referenceNodes: readonly this[]){
    return referenceNodes
  }

  select(selectedReferenceNodes: readonly Node[], allReferenceNodes: readonly Node[]){
    let filteredNodes = this.filter(this.filterCompareClass(selectedReferenceNodes))
    if(!filteredNodes.length) {
      if(!allReferenceNodes.length)
        return []
      filteredNodes = this.filterCompareClass(allReferenceNodes)
      filteredNodes = nullifyEmptyArray(this.filter(filteredNodes)) ?? (this.filterIsOptional ? filteredNodes : [])
    }
    if(filteredNodes.length > 1)
      for(const priority of new Set(this.children.map(x => x.compareClass.priority).sort((a, b) => b - a))) {
        let filteredChildrenNodes: readonly Node[] = filteredNodes.flatMap(x => x.children)
        for(const child of this.children)
          if(child.compareClass.priority === priority)
            filteredChildrenNodes = child.select(filteredChildrenNodes, [])
        if(!filteredChildrenNodes.length) continue
        filteredNodes = [...new Set(filteredChildrenNodes.map(x => x.parent))] as this[]
        if(filteredNodes.length === 1) break
      }
    return filteredNodes
  }

  adaptTo(selectedReferenceNodes: readonly Node[], allReferenceNodes: readonly Node[]): Node{
    const filteredNodes = this.select(selectedReferenceNodes, allReferenceNodes)
    if(!filteredNodes.length)
      return this.baseAdaptTo(filteredNodes, allReferenceNodes)
    return this._adaptTo(filteredNodes[0], filteredNodes, allReferenceNodes)
  }

  protected _adaptTo(
    selectedReferenceNode: this,
    selectedReferenceNodes: readonly this[],
    allReferenceNodes: readonly Node[],
  ): Node{
    selectedReferenceNode
    return this.baseAdaptTo(selectedReferenceNodes, allReferenceNodes)
  }

  baseAdaptTo(selectedReferenceNodes: readonly this[], allReferenceNodes: readonly Node[]){
    const adapted = this.clone()
    adapted.children = this.children.map(c =>
      c.adaptTo(selectedReferenceNodes.flatMap(c => c.children), allReferenceNodes),
    )
    return adapted
  }

  clone(): this{
    const clone: this = Object.create(Object.getPrototypeOf(this))
    Object.assign(clone, this)
    clone.id = idN++
    clone.parent = null
    clone.index = -1
    return clone
  }

  cloneDeep(): this{
    const clone: this = Object.create(Object.getPrototypeOf(this))
    Object.assign(clone, this)
    clone.children = clone.children.map(c => c.cloneDeep())
    clone._applyChildren()
    return clone
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
