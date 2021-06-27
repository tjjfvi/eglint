import { Filter } from "./FilterGroup"

export const propertyFilter = <T>(key: keyof T): Filter<T> => ({
  filter(self, others){
    const selfValue = self[key] // Only run getters once
    return others.filter(other => other[key] === selfValue)
  },
})
