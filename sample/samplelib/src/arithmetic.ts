export async function arithmetic (arr: number[], fn: (p: number, a: number) => number) {
  return arr.reduce(fn)
}
