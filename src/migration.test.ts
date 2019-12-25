import { SynorMigration, getMigrationInfoParser } from './migration'

describe('SynorMigration', () => {
  test('returns data', () => {
    expect(
      SynorMigration(
        { version: '0', type: 'do', title: 'Test', filename: '0.do.Test.sql' },
        Buffer.from('SELECT 1;')
      )
    ).toMatchSnapshot()
  })

  describe('getMigrationInfoParser', () => {
    let migrationInfoParser: ReturnType<typeof getMigrationInfoParser>

    beforeAll(() => {
      migrationInfoParser = getMigrationInfoParser({
        do: 'do',
        undo: 'undo',
        separator: '--'
      })
    })

    test('returns migrationInfoParser function', () => {
      expect(migrationInfoParser).toBeInstanceOf(Function)
    })

    test('returned function works (for valid filename)', () => {
      expect(migrationInfoParser('001.do--Test.sql')).toMatchSnapshot()
    })

    test('returned function throws (for invalid filename)', () => {
      expect(() => migrationInfoParser('001.do__Test.sql')).toThrow()
    })
  })
})
