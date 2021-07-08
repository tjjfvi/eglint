import { Filter } from "./Filter"
import { MultiMap } from "./MultiMap"
import { Node } from "./Node"

export class ReadonlySelection<T extends Node = Node> {

  protected values: ReadonlySet<T>
  protected parent?: ReadonlySelection<T>

  constructor(values?: Iterable<T>){
    if(!values)
      this.values = new Set()
    else if(values instanceof Set)
      this.values = values
    else if(values instanceof ReadonlySelection) {
      this.values = new Set(values.values)
      this.parent = values
    }
    else
      this.values = new Set(values)
  }

  first(): T | undefined{
    return this.values.values().next().value
  }

  get size(){
    return this.values.size
  }

  clone(): Selection<T>{
    return new Selection(this)
  }

  [Symbol.iterator](): IterableIterator<T>{
    return this.values[Symbol.iterator]()
  }

}

export class Selection<T extends Node = Node> extends ReadonlySelection<T> {

  protected override values!: Set<T>

  applyNode<This extends Selection<T>, U extends T>(this: This, node: U): This & Selection<U>{
    return node.filter(this)
  }

  applyClass<This extends Selection<T>, U extends T>(this: This, Class: Ctor<U>): This & Selection<U>{
    return this.applyPredicate((value): value is U => value instanceof Class)
  }

  applyFilter<This extends Selection<T>, S extends Node>(this: This, filter: Filter<S, T>, self: S): This{
    while(typeof filter.filter !== "function")
      filter = filter.filter
    filter.filter(self, this)
    return this
  }

  // eslint-disable-next-line max-len
  applyPredicate<This extends Selection<T>, U extends T>(this: This, predicate: (value: T) => value is U): This & Selection<U>
  applyPredicate<This extends Selection<T>>(this: This, predicate: (value: T) => boolean): This
  applyPredicate<This extends Selection<T>>(this: This, predicate: (value: T) => boolean): This{
    for(const value of this.values)
      if(!predicate(value))
        this.values.delete(value)
    return this
  }

  clear<This extends Selection<T>>(this: This): This{
    this.values.clear()
    return this
  }

  map<U extends Node>(fn: (value: T) => Iterable<U>): Selection<U>{
    const mapped = new Selection<U>()
    for(const t of this.values)
      for(const u of fn(t))
        mapped.values.add(u)
    return mapped
  }

  maybeApply(cb: (selection: Selection<T>) => void, required?: boolean): boolean{
    const forked = new Selection(this)
    cb(forked)
    if(forked.size || required) {
      this.values = forked.values
      return true
    }
    return false
  }

  applyMapped<This extends Selection<T>, U extends Node>(
    this: This,
    fn: (value: T) => Iterable<U>,
    cb: (mapped: Selection<U>) => void,
  ): This{
    const mapped = new Selection<U>()
    const reverseMap = new MultiMap<U, T>()
    for(const t of this.values)
      for(const u of fn(t)) {
        mapped.values.add(u)
        reverseMap.add(u, t)
      }
    cb(mapped)
    this.values.clear()
    for(const u of mapped.values)
      for(const t of reverseMap.get(u))
        this.values.add(t)
    return this
  }

}

type Ctor<T> = abstract new (...args: any[]) => T
