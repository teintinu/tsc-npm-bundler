import { arithmetic } from './arithmetic'

export async function subtract (arr: number[]) {
  return arithmetic(arr, (p, a) => p - a)
}
