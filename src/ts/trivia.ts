
import ts from "typescript"
import { SourceFileNode } from "./SourceFileNode"
import { Node } from "../Node"
import { IndentationContext, IndentNode } from "../IndentNode"
import { NewlineNode } from "../NewlineNode"
import { SpaceNode } from "../SpaceNode"
import { InterchangeableNode } from "../InterchangeableNode"
import { ContextProvider } from "../Context"
import { propertyFilter } from "../propertyFilter"
import { Reference } from "../Reference"
import { Selection } from "../Selection"

export function parseTriviaBetween(this: SourceFileNode, a?: ts.Node, b?: ts.Node){
  if(!a || !b) return this.emptyTrivia()
  return this.parseTrivia(a.end, this.getStart(b))
}

export function emptyTrivia(this: SourceFileNode){
  return [new TriviaNode(new WhitespaceNode([]))]
}

export function spaceTrivia(this: SourceFileNode){
  return [new TriviaNode(new WhitespaceNode([new SpaceNode(1)]))]
}

export function parseTrivia(this: SourceFileNode, start: number, end: number){
  if(this.pos !== start)
    throw new Error(`Gap at positions ${this.pos}-${start}`)
  let text = this.source.slice(start, end)
  let whitespaceChildren: Node[] = []
  let nodes = []
  let deltaIndentAcc = 0
  const calculateDeltaIndent = (indent: string) => {
    const deltaIndent = Math.floor(indent.length / this.indent.length) - this.indentLevel
    this.indentLevel += deltaIndent
    deltaIndentAcc += deltaIndent
    return deltaIndent
  }
  while(text.length) {
    let match
    if((match = /^( ?)\/\/( ?)(.*)\n( *)/.exec(text))) {
      const [, spaceBeforeSlashes, spaceAfterSlashes, innerText, indent] = match
      finishWhitespaceChildren()
      const deltaIndent = calculateDeltaIndent(indent)
      nodes.push(new TriviaNode(new EndlineComment(
        !!spaceBeforeSlashes,
        !!spaceAfterSlashes,
        innerText,
        deltaIndent,
      )))
      whitespaceChildren.push(new NewlineNode(1, deltaIndent))
    }
    else if((match = /^(?:\n([ \t]*))+/.exec(text)))
      whitespaceChildren.push(new NewlineNode(match[0].match(/\n/g)?.length ?? 0, calculateDeltaIndent(match[1])))
    else if((match = /^ +/.exec(text)))
      whitespaceChildren.push(new SpaceNode(match[0].length))
    else if((match = /^\/\*[^]*\*\//.exec(text))) {
      finishWhitespaceChildren()
      nodes.push(new TriviaNode(new BlockComment(match[0])))
    }
    else
      throw new Error("Encountered invalid trivia")
    text = text.slice(match[0].length)
    this.pos += match[0].length
  }
  finishWhitespaceChildren()
  return nodes
  function finishWhitespaceChildren(){
    nodes.push(new TriviaNode(new WhitespaceNode(whitespaceChildren, deltaIndentAcc)))
    whitespaceChildren = []
    deltaIndentAcc = 0
  }
}

export function finishTrivia(this: SourceFileNode, children: Node[]): [...Node[], IndentNode]{
  let deltaIndent = 0
  for(const child of children)
    if(child instanceof TriviaNode && child.children[0] instanceof WhitespaceNode)
      deltaIndent += child.children[0].deltaIndent
  children.push(new IndentNode(-deltaIndent))
  this.indentLevel -= deltaIndent
  return children as [...Node[], IndentNode]
}

export class TriviaNode extends Node {

  constructor(child: Node){
    super([child])
    this.filterGroup.addFilter({
      priority: 1,
      required: true,
      filter: propertyFilter("index"),
    })
  }

  override get priority(){
    return -1
  }

  override get requireContext(){
    return true
  }

  override get required(){
    return false
  }

}

export class WhitespaceNode extends InterchangeableNode {

  override get priority(){
    return -1
  }

  constructor(children: Node[], public deltaIndent = 0){
    super(children)
  }

  override init(){
    super.init()
    this.filterGroup.addFilter({
      priority: 1,
      filter: propertyFilter("equalityString"),
    })
  }

  get equalityString(){
    const contextProvider = new ContextProvider()
    const indentation = contextProvider.getContext(IndentationContext)
    indentation.level = Math.max(0, -this.deltaIndent)
    return this.deltaIndent + this.toString(contextProvider)
  }

}

export class EndlineComment extends Node {

  constructor(
    public spaceBeforeSlashes: boolean,
    public spaceAfterSlashes: boolean,
    public innerText: string,
    public deltaIndent: number,
  ){
    super()
  }

  override toString(contextProvider = new ContextProvider()){
    let text = ""
    if(this.spaceBeforeSlashes && this.findPrevCousin(x => x.hasText)?.toString().slice(-1) !== "\n")
      text += " "
    text += "//"
    if(this.spaceAfterSlashes)
      text += " "
    text += this.innerText
    const indentation = contextProvider.getContext(IndentationContext)
    if(!(this.findNextCousin(x => x.hasText) instanceof NewlineNode)) {
      indentation.level += this.deltaIndent
      text += "\n" + indentation
    }
    return text
  }

  override _adaptTo(_reference: Reference, selection: Selection<this>){
    const node = selection.first()
    if(!node) return this
    const clone = this.clone()
    clone.spaceBeforeSlashes = node.spaceBeforeSlashes
    clone.spaceAfterSlashes = node.spaceAfterSlashes
    clone.deltaIndent = node.deltaIndent
    return clone
  }

  override get required(){
    return true
  }

  override get hasText(){
    return true
  }

}

export class BlockComment extends Node {

  override get requireContext(){
    return true
  }

}

