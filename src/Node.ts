
import { cacheFn } from "./cacheFn"
import { ContextProvider } from "./Context"
import { inspect } from "./utils"

let idN = 0

export class Node {

  priority = 0

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
    this.children = this.children.map((child, i) => {
      if(child.parent)
        child = child.cloneDeep()
      child.parent = this
      child.index = i
      return child
    })
  }

  // may be overriden by constructor
  toString(context: ContextProvider = new ContextProvider()): string{
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
  protected filter(referenceNodes: readonly this[], allReferenceNodes?: readonly Node[]){
    allReferenceNodes
    return referenceNodes
  }

  requireContext = false
  select(selectedReferenceNodes: readonly Node[], allReferenceNodes: readonly Node[]){
    let filteredNodes: readonly this[] = this.filterCompareClass(selectedReferenceNodes)
    filteredNodes = null
      ?? nullifyEmptyArray(this.filter(filteredNodes, allReferenceNodes))
      ?? (this.filterIsOptional ? filteredNodes : [])
    if(!filteredNodes.length && !this.requireContext) {
      if(!allReferenceNodes.length)
        return []
      filteredNodes = this.filterCompareClass(allReferenceNodes)
      filteredNodes = nullifyEmptyArray(this.filter(filteredNodes)) ?? (this.filterIsOptional ? filteredNodes : [])
    }
    if(filteredNodes.length > 1 && (this.children.length > 1 || !allReferenceNodes.length))
      for(const priority of new Set(this.children.map(x => x.priority).sort((a, b) => b - a))) {
        let currentFilteredNodes = filteredNodes
        for(const child of this.children)
          if(child.priority === priority) {
            const children = currentFilteredNodes.flatMap(x => x.children)
            const filteredChildren = child.select(children, [])
            currentFilteredNodes = [...new Set(filteredChildren.map(x => x.parent as this))]
            if(!currentFilteredNodes.length)
              break
          }
        if(currentFilteredNodes.length)
          filteredNodes = currentFilteredNodes
      }
    return filteredNodes
  }

  adaptTo(selectedReferenceNodes: readonly Node[], allReferenceNodes: readonly Node[]): Node{
    const filteredNodes = this.select(selectedReferenceNodes, allReferenceNodes)
    return this._adaptTo(filteredNodes[0] ?? null, filteredNodes, allReferenceNodes)
  }

  protected _adaptTo(
    selectedReferenceNode: this | null,
    selectedReferenceNodes: readonly this[],
    allReferenceNodes: readonly Node[],
  ): Node{
    selectedReferenceNode
    const adapted = this.clone()
    adapted.children = this.children.map(c =>
      c.adaptTo(selectedReferenceNodes.flatMap(c => c.children), allReferenceNodes),
    )
    adapted._applyChildren()
    return adapted
  }

  protected clone(): this{
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

  toDebugString(contextProvider = new ContextProvider()){
    let acc = `${this.constructor.name} #${this.id}`
    if(!this.children.length)
      if(this.toString !== Node.prototype.toString)
        acc += " " + inspect(this.toString(contextProvider))
      else
        acc += " {}"
    if(this.children.length) {
      acc += " {"
      for(const child of this.children)
        acc += "\n" + child.toDebugString(contextProvider).replace(/^/gm, "  ")
      acc += "\n}"
    }
    return acc
  }

}

export function nullifyEmptyArray<T>(array: readonly T[]){
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
