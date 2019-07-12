import { add } from 'samplelib'

it('add', async () => {
  expect(await add([2, 1])).toBe(3)
})
