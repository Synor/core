import { crc32 } from './crc32'

describe('utils:crc32', () => {
  test('is deterministic', () => {
    expect(crc32('SYNOR')).toMatchInlineSnapshot(`-2028682762`)
  })
})
