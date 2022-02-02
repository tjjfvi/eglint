# `eglint` &nbsp;<sub><sup>an intuitive, unopinionated code formatter</sup></sub>

> ### *format one to format it all*


Many tools exist today to format code, but they generally have one of two
problems: they're opinionated (like prettier), or they're hard to configure
(like eslint).

`eglint` is an unopinionated code formatter that doesn't need configuration. To
specify your code style, you simply supply examples of correctly
formatted code.

*No configuration beyond the reference file is used.*

```ts
// reference file [containing examples of correct format]
let x = [ 1, 2, 3, 4 ];

let y = [
  "a",
  b + c,
  d.e,
];
```
```ts
// subject file [to be formatted by eglint]
const
  foo
= [ "abc"   
 , "def" ]
 ; let bar  =[1+ 2*3, [4,5],    ]
```
```ts
// output file [from eglint]
const foo = [
  "abc",
  "def",
];

let bar = [ 1 + 2 * 3, [ 4, 5 ] ];
```

In the example above, many issues are fixed, including contextual whitespace,
trailing commas, and semicolons (both misplaced and missing) — *all from the simple reference file*.

You can see it in action at [the interactive playgroud](https://eglint.t6.fyi/).
