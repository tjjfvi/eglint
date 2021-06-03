
export interface MapLike<K, V> {
  has(key: K): boolean,
  get(key: K): V | undefined,
  set(key: K, value: V): void,
}

export function cacheFn<T, U>(fn: (value: T) => U, map: MapLike<T, U>){
  const result = function(key: T): U{
    const existing = map.get(key)
    if(existing !== undefined) return existing
    const value = fn.call(
      // @ts-ignore
      this,
      key,
    )
    map.set(key, value)
    return value
  }
  result.memo = map
  return result
}
