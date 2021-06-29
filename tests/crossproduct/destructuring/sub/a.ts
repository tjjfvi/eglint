const {
  a,
  a: a,
  a = a,
  [a]: a = a,
  a: a = a,
  0: a,
  ...a
} = {};

({
  a,
  a: a,
  a: a = a,
  a = a,
  [a]: a.a = a,
  a: a.a = a,
  0: a.a,
  ...a.a
} = {})

const [
  a,
  a = a,
  ...a
] = a

;([
  a,
  a = a,
  ...a
] = a)