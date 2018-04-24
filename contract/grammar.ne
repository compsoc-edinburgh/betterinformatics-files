@{%
const moo = require("moo");
const R = require("ramda")

const lexer = moo.compile({
  ws: {match: /\s+/, lineBreaks: true},
  keywords: ["rpc", "type"],
  builtins: ["string", "int32", "bool", "Timestamp"],
  lname: /[a-z][a-z_]*/,
  uname: /[A-Z][a-zA-Z]*/,
  arr: '[]',
  '{': '{',
  '}': '}',
  ';': ';',
});
%}
@lexer lexer

Main -> Decl (__ Decl):* {% e => R.filter(v => v, R.flatten(e)) %}
Decl -> RpcDecl | TypeDecl

Builtin -> ("string" | "int32" | "bool" | "Timestamp") {% e => ({name: e[0][0].value, primitive: true}) %}
Type -> (UName | %arr UName | Builtin | %arr Builtin) {% ([e]) => {
  let v = e[e.length - 1]
  v = typeof v == "string" ? {name: v, primitive: false} : v
  return {...v, array: e.length > 1}
}%}

RpcDecl -> "rpc" __ UName __ Type __ Type {% (e) => ({kind: "rpc", name: e[2], req: e[4], res: e[6]})%}

TypeDecl -> "type" __ UName _ "{" _ (TypeField ";" _):* "}" {% e => ({kind: "type", name: e[2], fields: e[6].map(v => v[0])}) %}
TypeField -> Type __ LName {% e => ({type: e[0], name: e[2]}) %}

_ -> null | %ws {% _ => null %}
__ -> %ws {% _ => null %}

LName -> %lname {% e => e[0].value %}
UName -> %uname {% e => e[0].value %}