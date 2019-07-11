import { arithmetic } from './arithmetic'

/**
 * add values in array
 * @param arr
 * @returns sum
 */
export function add (arr: number[]) {
  return arithmetic(arr, (p, a) => p + a)
}
