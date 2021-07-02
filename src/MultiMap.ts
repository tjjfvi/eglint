
export class MultiMap<K, V> {

  #map = new Map<K, Set<V>>()

  get(key: K): Set<V>{
    const existing = this.#map.get(key)
    if(existing) return existing
    const set = new Set<V>()
    this.#map.set(key, set)
    return set
  }

  add(key: K, value: V){
    this.get(key).add(value)
    return this
  }

  delete(key: K, value: V){
    this.get(key).delete(value)
    return this
  }

}
