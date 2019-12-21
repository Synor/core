import { sanitizeContent } from './sanitize-content'

describe('utils:sanitizeContent', () => {
  test('normalizes newline', () => {
    expect(sanitizeContent(`SELECT 0;\r\nSELECT 1;`)).toBe(
      sanitizeContent(`SELECT 0;\nSELECT 1;`)
    )
  })

  test('trims whitespace', () => {
    const [contentOne, contentTwo, contentThree] = [
      sanitizeContent(`SELECT 0;\nSELECT 1;`),
      sanitizeContent(`\n  SELECT 0;\n  SELECT 1;\n`),
      sanitizeContent(`\n\t  SELECT 0;\n \tSELECT 1;`)
    ]

    expect(contentOne).toBe(contentTwo)
    expect(contentTwo).toBe(contentThree)
  })
})
