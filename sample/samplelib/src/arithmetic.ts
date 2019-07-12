export async function arithmetic (arr: number[], fn: (p: number, a: number) => number): Promise<number> {
  return arr.reduce<number>(fn, 0)
}
