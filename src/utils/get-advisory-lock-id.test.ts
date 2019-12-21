import { getAdvisoryLockId } from './get-advisory-lock-id'

describe('utils:getAdvisoryLockId', () => {
  test('is deterministic', () => {
    expect(getAdvisoryLockId('synor')).toMatchInlineSnapshot(`
      Array [
        "2266284534",
        "1883243334",
      ]
    `)
  })

  test('accepts multiple strings', () => {
    expect(getAdvisoryLockId('synor', 'migration_record').length).toBe(2)
    expect(getAdvisoryLockId('synor', 'migration_record', '...').length).toBe(2)
  })
})
