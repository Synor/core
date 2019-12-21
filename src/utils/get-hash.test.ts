import { getHash } from './get-hash'

describe('utils:getHash', () => {
  test('is deterministic', () => {
    expect(
      getHash(`
        SELECT 1;
      `)
    ).toMatchInlineSnapshot(
      `"17db4fd369edb9244b9f91d9aeed145c3d04ad8ba6e95d06247f07a63527d11a"`
    )
  })

  test('ignores whitespace changes', () => {
    const [hashOne, hashTwo, hashThree] = [
      getHash(`SELECT 0;\nSELECT 1;`),
      getHash(`\n  SELECT 0;\n  SELECT 1;\n`),
      getHash(`\n\t  SELECT 0;\n  \tSELECT 1;`)
    ]

    expect(hashOne).toBe(hashTwo)
    expect(hashTwo).toBe(hashThree)
  })
})
