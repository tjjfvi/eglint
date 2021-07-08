import { Filter, FilterFn } from "./Filter"
import { Node } from "./Node"
import { Selection } from "./Selection"

export type FilterGroupArgs<S extends Node, T extends Node> =
  Omit<Filter<S, T>, "filter"> & { mode: "and" | "or", filters: Filter<S, T>[] }

export class FilterGroup<S extends Node, T extends Node> implements Filter<S, T> {

  filters: Filter<S, T>[] = []

  mode: "and" | "or"
  priority?: number
  required?: boolean

  constructor({ mode, filters, priority, required }: FilterGroupArgs<S, T>){
    this.addFilters(filters)
    this.mode = mode
    this.priority = priority
    this.required = required
  }

  addFilters(filters: Filter<S, T>[]){
    for(const filter of filters)
      this.addFilter(filter)
  }

  addFilter(filter: Filter<S, T>){
    let index = 0
    for(const existingFilter of this.filters)
      if((existingFilter.priority ?? Infinity) >= (filter.priority ?? Infinity))
        index++
      else
        break
    this.filters.splice(index, 0, filter)
    return filter
  }

  _filter<Sel extends Selection<T>>(self: S, selection: Sel): Sel{
    if(this.mode === "and") {
      for(const filter of this.filters) {
        if(!selection.size)
          break
        if(selection.size === 1 && !filter.required)
          continue
        selection.maybeApply(sel => sel.applyFilter(filter, self), filter.required)
      }
      return selection
    }
    else {
      for(const filter of this.filters)
        if(selection.maybeApply(sel => sel.applyFilter(filter, self), filter.required))
          return selection
      return selection.clear()
    }
  }

  get filter(): FilterFn<S, T>{
    return this._filter
  }

}
