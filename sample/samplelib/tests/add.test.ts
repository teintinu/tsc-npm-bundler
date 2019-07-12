import { add } from 'samplelib'

export async function x () {
  return 1
}

it('add', () => {
  // expect('asfgasfglakh\nafsgakfghalkfs').toBe('asfgasfglakh\nafsgakfhalkfs')
  expect(add([2, 11])).toBe(3)
})
