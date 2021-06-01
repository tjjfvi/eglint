
import { ContextProvider } from "./Context"

export abstract class Node {

  abstract toString(context: ContextProvider): string

  #similarityMemo = new WeakMap<Node, number>()
  similarityTo(to: Node): number{
    const existing = this.#similarityMemo.get(to)
    if(existing !== undefined) return existing
    const similarity = this._similarityTo(to)
    this.#similarityMemo.set(to, similarity)
    return similarity
  }

  protected _similarityTo(to: Node): number{
    return to._similarityFrom(this)
  }

  protected _similarityFrom(from: Node): number{
    from
    return 0
  }

  #reconcileMemo = new WeakMap<Node, Node>()
  reconcileTo(to: Node): Node{
    const existing = this.#reconcileMemo.get(to)
    if(existing !== undefined) return existing
    const reconciled = this._reconcileTo(to)
    this.#reconcileMemo.set(to, reconciled)
    return reconciled
  }

  protected _reconcileTo(to: Node): Node{
    to
    return to._reconcileFrom(this)
  }

  protected _reconcileFrom(from: Node): Node{
    return from
  }

}
