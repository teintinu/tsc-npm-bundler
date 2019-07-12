import { subtract } from 'samplelib'

it('subtract', async () => {
  expect(await subtract([-3, 1])).toBe(2)
})
