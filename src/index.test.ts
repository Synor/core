import { Synor, SynorError, getGitUserInfo, sortVersions } from './index'
import { getMigrationInfoParser } from './migration'

jest.mock('./migrator', () => {
  return {
    SynorMigrator: function() {
      return 'migrator'
    }
  }
})

jest.mock('./migration', () => ({
  getMigrationInfoParser: jest.fn()
}))

const migrationInfoNotation = {}
const migrationInfoParser = jest.fn()

describe('Synor', () => {
  describe('module exports', () => {
    test('exports helpers', () => {
      expect(getGitUserInfo).toBeInstanceOf(Function)
      expect(sortVersions).toBeInstanceOf(Function)
    })

    test('exports SynorError', () => {
      expect(SynorError).toBeInstanceOf(Function)
    })
  })

  test('can be initialized', () => {
    const synor = Synor({ migrationInfoParser } as any)
    expect(synor).toMatchInlineSnapshot(`
      Object {
        "migrator": SynorMigrator {},
      }
    `)
  })

  test('sets migrationInfoParser if not provided', () => {
    Synor({ migrationInfoNotation } as any)
    expect(getMigrationInfoParser).toHaveBeenCalledWith(migrationInfoNotation)
  })
})
