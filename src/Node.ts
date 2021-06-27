
import { cacheFn } from "./cacheFn"
import { ContextProvider } from "./Context"
import { FilterGroup } from "./FilterGroup"
import { inspect } from "./utils"

let idN = 0

export type NodeClass<T extends Node> = (new (...args: any) => T) & Omit<typeof Node, never>

export abstract class Node {

  get priority(){
    return 1
  }

  id = idN++
  text = ""
  children: readonly Node[] = []
  parent: Node | null = null
  index = -1

  filterGroup = new FilterGroup<this>({ mode: "and", filters: [] })

  get filterByChildren(){
    return true
  }

  constructor(args?: readonly Node[] | string){
    if(args instanceof Array) {
      this.children = args
      const childClasses = [...new Set(this.children.map(x => x.compareClass))]
      if(this.filterByChildren)
        this.filterGroup.filters = childClasses
          .map(Class =>
            [Class, Class.prototype.priority, Class.prototype.required] as const,
          )
          .filter(([Class]) => Class.prototype.influenceParent)
          .sort((a, b) => b[1] - a[1])
          .map(([Class, priority, required]) => ({
            priority,
            required,
            filter<T extends Node>(self: T, nodes: readonly T[]){
              for(const child of self.children)
                if(child.compareClass === Class) {
                  const children = nodes.flatMap(x => x.children)
                  const filteredChildren = child.select(children, [])
                  nodes = [...new Set(filteredChildren.map(x => x.parent as T))]
                  if(!nodes.length)
                    break
                }
              return nodes
            },
          }))
    }
    else if(typeof args === "string")
      this.text = args
    this._applyChildren()
    this.init()
  }

  init(){}

  get required(): "strong" | "weak" | false{
    return this.requireContext ? "strong" : false
  }

  get influenceParent(){
    return true
  }

  protected _applyChildren(){
    this.children = this.children.map((child, i) => {
      if(child.parent)
        child = child.cloneDeep()
      child.parent = this
      child.index = i
      return child
    })
  }

  toString(context = new ContextProvider()): string{
    let acc = this.text
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

  compareClass = this.constructor as NodeClass<this>
  filterCompareClass: (nodes: readonly Node[]) => this[] = filterInstanceOf(this.compareClass) as never

  filter(nodes: readonly Node[], requireWeak: boolean){
    return this.filterGroup.filter(this, this.filterCompareClass(nodes), requireWeak)
  }

  get requireContext(){
    return false
  }

  select(selectedReferenceNodes: readonly Node[], allReferenceNodes: readonly Node[]){
    let filteredNodes = this.filter(selectedReferenceNodes, true)
    if(!filteredNodes.length && !this.requireContext)
      filteredNodes = this.filter(allReferenceNodes, false)
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
      if(this.hasText)
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

  findPrevCousin(predicate: (x: Node) => boolean | "skip"): Node | null{
    let cur: Node = this
    while(true) {
      if(!cur.parent) return null
      for(let i = cur.index - 1; i > 0; i--) {
        const sibling = cur.parent.children[i]
        const result = sibling.findLastDescendant(predicate)
        if(result) return result
      }
      cur = cur.parent
    }
  }

  findLastDescendant(predicate: (x: Node) => boolean | "skip"): Node | null{
    let stack: Node[] = [this]
    let cur
    while((cur = stack.pop())) {
      const result = predicate(cur)
      if(result === true) return cur
      if(result !== "skip")
        for(let i = 0; i < cur.children.length; i++)
          stack.push(cur.children[i])
    }
    return null
  }

  findNextCousin(predicate: (x: Node) => boolean | "skip"): Node | null{
    let cur: Node = this
    while(true) {
      if(!cur.parent) return null
      for(let i = cur.index + 1; i < cur.parent.children.length; i++) {
        const sibling = cur.parent.children[i]
        const result = sibling.findFirstDescendant(predicate)
        if(result) return result
      }
      cur = cur.parent
    }
  }

  findFirstDescendant(predicate: (x: Node) => boolean | "skip"): Node | null{
    let stack: Node[] = [this]
    let cur
    while((cur = stack.pop())) {
      const result = predicate(cur)
      if(result === true) return cur
      if(result !== "skip")
        for(let i = cur.children.length - 1; i >= 0; i--)
          stack.push(cur.children[i])
    }
    return null
  }

  get hasText(){
    return !!this.text
  }

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
