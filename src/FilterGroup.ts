import { Filter, FilterFn } from "./Filter"
import { Selection } from "./Selection"

export type FilterGroupArgs<S, T> = Omit<Filter<S, T>, "filter"> & { mode: "and" | "or", filters: Filter<S, T>[] }

export class FilterGroup<S, T> implements Filter<S, T> {

  filters: Filter<S, T>[] = []

  mode: "and" | "or"
  priority?: number
  required?: "strong" | "weak" | false

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

  _filter<Sel extends Selection<T>>(self: S, values: Sel, requireWeak: boolean): Sel{
    const isRequired = (filter: Filter<S, T>) =>
      requireWeak ? filter.required : filter.required === "strong"
    if(this.mode === "and") {
      for(const filter of this.filters) {
        if(!values.size)
          break
        if(values.size === 1 && !isRequired(filter))
          continue
        const filteredValues = values.fork().applyFilter(filter, self, requireWeak)
        if(filteredValues.size || isRequired(filter))
          filteredValues.apply()
      }
      return values
    }
    else {
      for(const filter of this.filters) {
        const filteredValues = values.fork().applyFilter(filter, self, requireWeak)
        if(filteredValues.size || isRequired(filter))
          return filteredValues.apply()
      }
      return values.clear()
    }
  }

  get filter(): FilterFn<S, T>{
    return this._filter
  }

}
