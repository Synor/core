import { SynorError, toSynorError } from './error'

describe('SynorError', () => {
  test('can be initialized [with: (message)]', () => {
    const error = new SynorError('synorError')
    expect(error).toBeInstanceOf(Error)
    expect(error.data).toMatchInlineSnapshot(`Object {}`)
    expect(error.type).toMatchInlineSnapshot(`"exception"`)
  })

  test('can be initialized [with: (message,type,data)]', () => {
    const type = 'not_found'
    const data = { id: 0 }
    const error = new SynorError('synorError', type, data)
    expect(error).toBeInstanceOf(Error)
    expect(error.data).toBe(data)
    expect(error.type).toBe(type)
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
