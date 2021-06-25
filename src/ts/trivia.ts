
import ts from "typescript"
import { SourceFileNode } from "./SourceFileNode"
import { Node } from "../Node"
import { IndentNode } from "../IndentNode"
import { NewlineNode } from "../NewlineNode"
import { SpaceNode } from "../SpaceNode"
import { InterchangeableNode } from "../InterchangeableNode"
import { RelativePositionalNode } from "../RelativePositionalNode"

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

const triviaRegex = /^ +|^\n *|^\/\/.*\n|^\/\*[^]*\*\//
export function parseTrivia(this: SourceFileNode, start: number, end: number){
  const text = this.source.slice(start, end)
  let whitespaceChildren = []
  let nodes = []
  let deltaIndentAcc = 0
  let ind = 0
  while(ind < text.length) {
    const [match] = text.slice(ind).match(triviaRegex) ?? [null]
    if(!match) throw new Error("Encountered invalid trivia")
    ind += match.length
    if(match[0] === " ")
      whitespaceChildren.push(new SpaceNode(match.length))
    else if(match[0] === "\n") {
      const deltaIndent = Math.floor((match.length - 1) / 2) - this.indentLevel
      this.indentLevel += deltaIndent
      deltaIndentAcc += deltaIndent
      whitespaceChildren.push(new NewlineNode(deltaIndent))
    }
    else {
      nodes.push(new TriviaNode([new WhitespaceNode(whitespaceChildren)], deltaIndentAcc))
      whitespaceChildren = []
      deltaIndentAcc = 0
      nodes.push(new TriviaNode([new CommentNode(match)], deltaIndentAcc))
    }
  }
  nodes.push(new TriviaNode([new WhitespaceNode(whitespaceChildren)], deltaIndentAcc))
  return nodes
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

export class CommentNode extends Node {

  override get requireContext(){
    return true
  }

}

