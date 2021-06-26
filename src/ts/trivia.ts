
import ts from "typescript"
import { SourceFileNode } from "./SourceFileNode"
import { Node } from "../Node"
import { IndentationContext, IndentNode } from "../IndentNode"
import { NewlineNode } from "../NewlineNode"
import { SpaceNode } from "../SpaceNode"
import { InterchangeableNode } from "../InterchangeableNode"
import { RelativePositionalNode } from "../RelativePositionalNode"
import { ContextProvider } from "../Context"

export function parseTriviaBetween(this: SourceFileNode, a?: ts.Node, b?: ts.Node){
  if(!a || !b) return this.emptyTrivia()
  return this.parseTrivia(a.end, b.getStart(this.sourceFile))
}

export function emptyTrivia(this: SourceFileNode){
  return [new TriviaNode([new WhitespaceNode([])])]
}

export function spaceTrivia(this: SourceFileNode){
  return [new TriviaNode([new WhitespaceNode([new SpaceNode(1)])])]
}

export function parseTrivia(this: SourceFileNode, start: number, end: number){
  let text = this.source.slice(start, end)
  let whitespaceChildren: Node[] = []
  let nodes = []
  let deltaIndentAcc = 0
  const calculateDeltaIndent = (indent: string) => {
    const deltaIndent = Math.floor(indent.length / 2) - this.indentLevel
    this.indentLevel += deltaIndent
    deltaIndentAcc += deltaIndent
    return deltaIndent
  }
  while(text.length) {
    let match
    if((match = /^( ?)\/\/( ?)(.*)\n( *)/.exec(text))) {
      const [, spaceBeforeSlashes, spaceAfterSlashes, innerText, indent] = match
      finishWhitespaceChildren()
      nodes.push(new TriviaNode([new EndlineComment(
        !!spaceBeforeSlashes,
        !!spaceAfterSlashes,
        innerText,
        calculateDeltaIndent(indent),
      )], deltaIndentAcc))
      whitespaceChildren.push(new NewlineNode(calculateDeltaIndent(indent)))
      deltaIndentAcc = 0
    }
    else if((match = /^\n( *)/.exec(text)))
      whitespaceChildren.push(new NewlineNode(calculateDeltaIndent(match[1])))
    else if((match = /^ +/.exec(text)))
      whitespaceChildren.push(new SpaceNode(match[0].length))
    else if((match = /^\/\*[^]*\*\//.exec(text))) {
      finishWhitespaceChildren()
      nodes.push(new TriviaNode([new BlockComment(match[0])]))
    }
    else
      throw new Error("Encountered invalid trivia")
    text = text.slice(match[0].length)
  }
  finishWhitespaceChildren()
  return nodes
  function finishWhitespaceChildren(){
    nodes.push(new TriviaNode([new WhitespaceNode(whitespaceChildren)], deltaIndentAcc))
    whitespaceChildren = []
    deltaIndentAcc = 0
  }
}

export function finishTrivia(this: SourceFileNode, children: Node[]){
  let deltaIndent = 0
  for(const child of children)
    if(child instanceof TriviaNode)
      deltaIndent += child.deltaIndent
  children.push(new IndentNode(-deltaIndent))
  this.indentLevel -= deltaIndent
  return children
}

export class TriviaNode extends RelativePositionalNode {

  constructor(children: readonly Node[], public deltaIndent = 0){
    super(children)
  }

  override get priority(){
    return -1
  }

  override get required(): false{
    return false
  }

}

export class WhitespaceNode extends InterchangeableNode {}

export class EndlineComment extends NewlineNode {

  constructor(
    public spaceBeforeSlashes: boolean,
    public spaceAfterSlashes: boolean,
    public innerText: string,
    deltaIndent: number,
  ){
    super(deltaIndent)
  }

  override toString(contextProvider = new ContextProvider()){
    let text = ""
    if(this.spaceBeforeSlashes && !(this.prevLeaf() instanceof NewlineNode))
      text += " "
    text += "//"
    if(this.spaceAfterSlashes)
      text += " "
    text += this.innerText
    const indentation = contextProvider.getContext(IndentationContext)
    if(!(this.nextLeaf() instanceof NewlineNode)) {
      indentation.level += this.deltaIndent
      text += "\n" + indentation
    }
    return text
  }

  override _adaptTo(node: this | null){
    if(!node) return this
    const clone = this.clone()
    clone.spaceBeforeSlashes = node.spaceBeforeSlashes
    clone.spaceAfterSlashes = node.spaceAfterSlashes
    clone.deltaIndent = node.deltaIndent
    return clone
  }

  override get required(): "strong"{
    return "strong"
  }

}

export class BlockComment extends Node {

  override get requireContext(){
    return true
  }

}

