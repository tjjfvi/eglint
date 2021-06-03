import { cacheFn } from "./cacheFn"
import { Adapter, Node } from "./Node"

export class Criterion<T = unknown> {

  constructor(private classifier: (node: Node) => T, public adapter?: Adapter){}

  classify = cacheFn(this.classifier, new WeakMap())

  group = cacheFn(this._group, new WeakMap())
  private _group(nodes: readonly Node[]): Map<T, readonly Node[]>{
    const groups = new Map<T, Node[]>()
    const getGroup = cacheFn(() => [], groups)
    for(const node of nodes) {
      const classification = this.classify(node)
      if(classification !== false as unknown)
        getGroup(classification).push(node)
    }
    return groups
  }

  select(source: Node, referenceNodes: readonly Node[]): readonly Node[]{
    return this.group(referenceNodes).get(this.classify(source)) ?? []
  }

  apply(node: Node){
    node
  }

}

export class DataCriterion<T = unknown> extends Criterion<T | false> {

  constructor(adapter?: Adapter){
    super(() => false, adapter)
  }

  for = cacheFn(this._for, new Map<T, DataCriterion<T>>())
  _for(value: T): DataCriterion<T>{
    const result: this = Object.create(this)
    result.apply = node => {
      if(this.classify.memo.has(node))
        throw new Error("Cannot set value for already classified node")
      this.classify.memo.set(node, value)
    }
    return result
  }

}

export class PresenceCriterion extends Criterion<boolean> {

  constructor(adapter?: Adapter){
    super(() => false, adapter)
  }

  override apply(node: Node){
    this.classify.memo.set(node, true)
  }

}
