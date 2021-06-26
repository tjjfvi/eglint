
export class ContextProvider {

  constructor(private map = new Map<new(contextProvider: ContextProvider) => any, any>()){}

  getContext<T extends Context>(ctor: new (contextProvider: ContextProvider) => T): T{
    const existing = this.map.get(ctor)
    if(existing) return existing
    const token = new ctor(this)
    this.map.set(ctor, token)
    return token
  }

}

export abstract class Context {

  constructor(public contextProvider: ContextProvider){}

}
