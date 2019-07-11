import { arithmetic } from './arithmetic'

export function subtract (arr: number[]) {
  return arithmetic(arr, (p, a) => p - a)
}
