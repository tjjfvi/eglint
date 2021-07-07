import { Filter } from "./Filter"
import { MultiMap } from "./MultiMap"
import { Node } from "./Node"

export class Selection<T extends Node = Node> {

  constructor(public _values = new Set<T>()){}

  first(): T | undefined{
    return this._values.values().next().value
  }

  get size(){
    return this._values.size
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
    for(const value of this._values)
      if(!predicate(value))
        this._values.delete(value)
    return this
  }

  clone(): Selection<T>{
    return new Selection(new Set(this._values))
  }

  clear<This extends Selection<T>>(this: This): This{
    this._values.clear()
    return this
  }

  fork<This extends Selection<T>>(this: This): ForkedSelection<This, T>{
    return new ForkedSelection(this)
  }

  map<U extends Node>(fn: (value: T) => Iterable<U>): MappedSelection<this, T, U>{
    return new MappedSelection(this, fn)
  }

  [Symbol.iterator](): IterableIterator<T>{
    return this._values[Symbol.iterator]()
  }

}

export class ForkedSelection<Sel extends Selection<T>, T extends Node> extends Selection<T> {

  constructor(private _original: Sel){
    super(new Set(_original._values))
  }

  apply(): Sel{
    this._original._values = this._values
    return this._original
  }

}

export class MappedSelection<Sel extends Selection<T>, T extends Node, U extends Node> extends Selection<U> {

  private _reverseMap = new MultiMap<U, T>()

  constructor(private _original: Sel, fn: (value: T) => Iterable<U>){
    super(new Set())
    for(const t of this._original._values)
      for(const u of fn(t)) {
        this._values.add(u)
        this._reverseMap.add(u, t)
      }
  }

  apply(): Sel{
    this._original._values.clear()
    for(const u of this._values)
      for(const t of this._reverseMap.get(u))
        this._original._values.add(t)
    return this._original
  }

}

type Ctor<T> = abstract new (...args: any[]) => T
