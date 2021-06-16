
import { cacheFn } from "./cacheFn"
import { ContextProvider } from "./Context"
import { FilterGroup } from "./FilterGroup"
import { inspect } from "./utils"

let idN = 0

export abstract class Node {

  priority = 1

  id = idN++
  children: readonly Node[] = []
  parent: Node | null = null
  index = -1

  filterGroup = new FilterGroup<this>([])

  constructor(args?: readonly Node[] | string){
    if(args instanceof Array) {
      this.children = args
      const childClasses = [...new Set(this.children.map(x => x.compareClass))]
      this.filterGroup.filters = childClasses
        .map(x => [x, this.children.find(c => c.compareClass === x)?.priority ?? 0] as const)
        .sort((a, b) => b[1] - a[1])
        .map(([compareClass, priority]) => ({
          priority,
          optional: false,
          filter(self, origNodes){
            let nodes = origNodes
            let anyMatched = false
            for(const child of self.children)
              if(child.compareClass === compareClass) {
                const children = nodes.flatMap(x => x.children)
                const filteredChildren = child.select(children, [])
                nodes = [...new Set(filteredChildren.map(x => x.parent as self))]
                anyMatched ||= !!nodes.length
                if(!nodes.length)
                  break
              }
            if(!nodes.length && !anyMatched)
              return origNodes
            return nodes
          },
        }))
    }
    else if(typeof args === "string")
      this.toString = () => args
    this._applyChildren()
    type self = this
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

  filter(nodes: readonly Node[]){
    return this.filterGroup.filter(this, this.filterCompareClass(nodes))
  }

  requireContext = false
  select(selectedReferenceNodes: readonly Node[], allReferenceNodes: readonly Node[]){
    let filteredNodes = this.filter(selectedReferenceNodes)
    if(!filteredNodes.length && !this.requireContext)
      filteredNodes = this.filter(allReferenceNodes)
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
