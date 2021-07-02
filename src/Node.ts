
import { ContextProvider } from "./Context"
import { Filter } from "./Filter"
import { FilterGroup } from "./FilterGroup"
import { Reference } from "./Reference"
import { Selection } from "./Selection"
import { inspect } from "./utils"

let idN = 0

export type NodeClass<T extends Node> = (new (...args: any) => T) & Omit<typeof Node, never>
export type AbstractNodeClass<T extends Node> = (abstract new (...args: any) => T) & Omit<typeof Node, never>

export abstract class Node {

  get priority(){
    return 1
  }

  id = idN++
  text = ""
  children: readonly Node[] = []
  parent: Node | null = null
  index = -1

  filterGroup = new FilterGroup<this, this>({ mode: "and", filters: [] })

  get filterByChildren(){
    return true
  }

  constructor(args?: readonly Node[] | string){
    if(args instanceof Array) {
      this.children = args
      this._applyChildren()
      if(this.filterByChildren)
        this._addChildrenFilters()
    }
    else if(typeof args === "string")
      this.text = args
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
      if(child.parent && (child.parent !== this || child.index !== i))
        child = child.cloneDeep()
      child.parent = this
      child.index = i
      return child
    })
  }

  protected _addChildrenFilters(){
    this.filterGroup.filters = [...new Set(this.children.map(x => x.constructor))]
      .filter(Class => Class.prototype.influenceParent)
      .sort((a, b) => b.prototype.priority - a.prototype.priority)
      .map((Class): Filter<this, this> => ({
        priority: Class.prototype.priority,
        required: Class.prototype.required,
        filter(self, selection){
          for(const child of self.children)
            if(child.constructor === Class) {
              child.filter(selection.map(x => x.children), true).apply()
              if(!selection.size)
                break
            }
          return selection
        },
      }))
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

  filter<S extends Selection<Node>>(selection: S, requireWeak: boolean): S & Selection<this>{
    return selection
      .applyClass(this.constructor)
      .applyFilter(this.filterGroup, this, requireWeak)
  }

  get requireContext(){
    return false
  }

  select(reference: Reference, selection: Selection<Node>): Selection<this>{
    const filteredSelection = this.filter(selection, true)
    if(!filteredSelection.size && !this.requireContext)
      return this.filter(reference.fullSelection(), false)
    return filteredSelection
  }

  adaptTo(reference: Reference, selection = reference.fullSelection()): Node{
    return this._adaptTo(reference, this.select(reference, selection))
  }

  get adaptStages(): readonly AbstractNodeClass<Node>[]{
    return [Node]
  }

  protected _adaptTo(reference: Reference, selection: Selection<this>): Node{
    const selectedChildren = selection.map(x => x.children)
    const adapted = this.clone()
    for(const Class of this.adaptStages) {
      adapted.children = adapted.children.map(c => (
        c instanceof Class
          ? c.adaptTo(reference, selectedChildren.clone())
          : c
      ))
      adapted._applyChildren()
    }
    return adapted
  }

  protected clone(): this{
    const clone: this = Object.create(Object.getPrototypeOf(this))
    Object.defineProperties(clone, Object.getOwnPropertyDescriptors(this))
    clone.id = idN++
    clone.parent = null
    clone.index = -1
    return clone
  }

  cloneDeep(): this{
    const clone: this = this.clone()
    Object.assign(clone, this)
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
export interface Node {
  constructor: NodeClass<this>,
}
