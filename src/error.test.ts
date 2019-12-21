import {
  SynorError,
  SynorMigrationError,
  toSynorError,
  SynorValidationError
} from './error'

type MigrationRecord = import('./migration').MigrationRecord

describe('SynorError', () => {
  test('can be initialized [with: (message)]', () => {
    const error = new SynorError('synorError')
    expect(error).toBeInstanceOf(Error)
    expect(error.data).toMatchInlineSnapshot(`Object {}`)
    expect(error.type).toMatchInlineSnapshot(`"exception"`)
  })

  test('can be initialized [with: (message,data)]', () => {
    const error = new SynorError('synorError', 'DATA')
    expect(error.data).toMatchInlineSnapshot(`"DATA"`)
    expect(error.type).toMatchInlineSnapshot(`"exception"`)
  })

  test('can be initialized [with: (message,data,type)]', () => {
    const error = new SynorError('synorError', { id: 0 }, 'not_found')
    expect(error.data).toMatchInlineSnapshot(`
      Object {
        "id": 0,
      }
    `)
    expect(error.type).toMatchInlineSnapshot(`"not_found"`)
  })

  test('can be initialized [with: (message,Error)]', () => {
    const error = new SynorError('synorError', new Error('error'))
    expect(error.data).toBeInstanceOf(Error)
    expect(error.type).toMatchInlineSnapshot(`"exception"`)
    expect(error.stack).toBeDefined()
  })

  describe('toSynorError', () => {
    test('returns SynorError as is', () => {
      const synorError = new SynorError('synorError')
      expect(synorError).toBeInstanceOf(SynorError)
      expect(toSynorError(synorError)).toBe(synorError)
    })

    test('returns Error wrapped with SynorError', () => {
      const error = new Error('error')
      const synorError = toSynorError(error)
      expect(synorError).toBeInstanceOf(SynorError)
      expect(synorError.data).toBe(error)
      expect(synorError.message).toMatchInlineSnapshot(`"Exception: error"`)
      expect(synorError.type).toMatchInlineSnapshot(`"exception"`)
    })
  })
})

describe('SynorMigrationError', () => {
  test('can be initialized', () => {
    const error = new SynorMigrationError('not_found', { id: 0 })
    expect(error).toBeInstanceOf(Error)
    expect(error.data).toMatchInlineSnapshot(`
      Object {
        "id": 0,
      }
    `)
    expect(error.type).toMatchInlineSnapshot(`"not_found"`)
  })

  test('is instance of SynorError', () => {
    const error = new SynorMigrationError('not_found', { id: 0 })
    expect(error).toBeInstanceOf(SynorError)
  })
})

describe('SynorValidationError', () => {
  const record: MigrationRecord = {
    id: 0,
    version: '0',
    type: 'do',
    title: 'Test',
    hash: '',
    appliedAt: new Date('2020-01-01T00:00:00Z'),
    appliedBy: 'Synor',
    executionTime: 0,
    dirty: false
  }

  test('can be initialized', () => {
    const error = new SynorValidationError('dirty', record)
    expect(error).toBeInstanceOf(Error)
    expect(error.data).toEqual(record)
    expect(error.type).toMatchInlineSnapshot(`"dirty"`)
  })

  test('is instance of SynorError', () => {
    const error = new SynorValidationError('hash_mismatch', record)
    expect(error).toBeInstanceOf(SynorError)
  })
})
