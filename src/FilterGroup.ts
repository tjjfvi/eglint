
// Covariant :/
export interface Filter<T> {
  priority: number,
  optional: boolean,
  filter(value: T, nodes: readonly T[]): readonly T[],
}

export class FilterGroup<T> implements Filter<T> {

  lastMandatoryFilterInd = -1
  filters: Filter<T>[] = []

  constructor(filters: Filter<T>[], public priority = 0, public optional = true){
    this.addFilters(filters)
  }

  addFilters(filters: Filter<T>[]){
    for(const filter of filters)
      this.addFilter(filter)
  }

  addFilter(filter: Filter<T>){
    let index = 0
    for(const existingFilter of this.filters)
      if(existingFilter.priority > filter.priority)
        index++
      else
        break
    this.filters.splice(index, 0, filter)
    if(!filter.optional && index > this.lastMandatoryFilterInd)
      this.lastMandatoryFilterInd = index
    else if(index <= this.lastMandatoryFilterInd)
      this.lastMandatoryFilterInd++
    return filter
  }

  updatePriority(filter: Filter<T>, priority: number){
    const oldIndex = this.filters.indexOf(filter)
    if(oldIndex !== -1) {
      this.filters.splice(oldIndex, 1)
      if(oldIndex <= this.lastMandatoryFilterInd)
        this.lastMandatoryFilterInd--
    }
    filter.priority = priority
    this.addFilter(filter)
  }

  filter(value: T, nodes: readonly T[]){
    for(const [i, filter] of this.filters.entries()) {
      if(!nodes.length) break
      if(nodes.length === 1)
        if(i > this.lastMandatoryFilterInd)
          break
        else if(filter.optional)
          continue
      const filteredNodes = filter.filter(value, nodes)
      if(filteredNodes.length || !filter.optional)
        nodes = filteredNodes
    }
    return nodes
  }

}
