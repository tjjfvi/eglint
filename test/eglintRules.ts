// @ts-nocheck
// eg

const x = [1, 2, "abc", 5n + 6n, []]

const y = {
  a: 1,
  b: 2,
  c,
  ...{ x },
}
