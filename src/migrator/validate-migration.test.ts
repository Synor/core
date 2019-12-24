import { SynorValidationError } from '../error'
import { getMigrationRecord, getMigrationSource } from './index.utils.test'
import { validateMigration } from './validate-migration'

describe('migrator:validateMigration', () => {
  let record: Parameters<typeof validateMigration>[0]
  let source: Parameters<typeof validateMigration>[1]

  beforeEach(() => {
    record = getMigrationRecord({})
    source = getMigrationSource({})
  })

  test('throws if dirty', () => {
    record.dirty = true

    try {
      validateMigration(record, source)
    } catch (error) {
      expect(error).toBeInstanceOf(SynorValidationError)
      expect(error.type).toMatchInlineSnapshot(`"dirty"`)
    }
  })

  test('throws if hash mismatched', () => {
    record.hash = ''
    source.hash = '-'

    try {
      validateMigration(record, source)
    } catch (error) {
      expect(error).toBeInstanceOf(SynorValidationError)
      expect(error.type).toMatchInlineSnapshot(`"hash_mismatch"`)
    }
  })

  test('does nothing if valid', () => {
    expect(validateMigration(record, source)).toBeUndefined()
  })
})
