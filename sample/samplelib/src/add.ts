import { arithmetic } from './arithmetic'

/**
 * add values in array
 * @param arr
 * @returns sum
 */
export async function add (arr: number[]) {
  return arithmetic(arr, (p, a) => p + a)
}
