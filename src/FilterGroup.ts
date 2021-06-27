
export type FilterFn<T> = <U extends T>(value: U, nodes: readonly U[], requireWeak: boolean) => readonly U[]
export interface Filter<T> {
  /** Defaults to Infinity */
  priority?: number,
  /** Defaults to false */
  required?: "strong" | "weak" | false,
  filter: FilterFn<T> | Filter<T>,
  // Disallow arrays
  slice?: never,
}

export type FilterGroupArgs<T> = Omit<Filter<T>, "filter"> & { mode: "and" | "or", filters: Filter<T>[] }

export class FilterGroup<T> implements Filter<T> {

  filters: Filter<T>[] = []

  mode: "and" | "or"
  priority?: number
  required?: "strong" | "weak" | false

  constructor({ mode, filters, priority, required }: FilterGroupArgs<T>){
    this.addFilters(filters)
    this.mode = mode
    this.priority = priority
    this.required = required
  }

  addFilters(filters: Filter<T>[]){
    for(const filter of filters)
      this.addFilter(filter)
  }

  addFilter(filter: Filter<T>){
    let index = 0
    for(const existingFilter of this.filters)
      if((existingFilter.priority ?? Infinity) >= (filter.priority ?? Infinity))
        index++
      else
        break
    this.filters.splice(index, 0, filter)
    return filter
  }

  _filter<U extends T>(value: U, nodes: readonly U[], requireWeak: boolean){
    const isRequired = (filter: Filter<T>) =>
      requireWeak ? filter.required : filter.required === "strong"
    if(this.mode === "and") {
      for(const filter of this.filters) {
        if(!nodes.length)
          break
        if(nodes.length === 1 && !isRequired(filter))
          continue
        const filteredNodes = applyFilter(filter, value, nodes, requireWeak)
        if(filteredNodes.length || isRequired(filter))
          nodes = filteredNodes
      }
      return nodes
    }
    else {
      for(const filter of this.filters) {
        const filteredNodes = applyFilter(filter, value, nodes, requireWeak)
        if(filteredNodes.length || isRequired(filter))
          return filteredNodes
      }
      return []
    }
  }

  get filter(): FilterFn<T>{
    return this._filter
  }

}

export function applyFilter<T, U extends T>(filter: Filter<T>, value: U, nodes: readonly U[], requireWeak: boolean){
  while(typeof filter.filter !== "function")
    filter = filter.filter
  return filter.filter(value, nodes, requireWeak)
}
