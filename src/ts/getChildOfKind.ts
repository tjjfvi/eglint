import ts from "typescript"

export function getChildOfKind(children: ts.Node[], index: number, ...kinds: ts.SyntaxKind[]){
  return kinds.includes(children[index].kind) ? children[index] : undefined
}
