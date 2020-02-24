import { SynorError } from './error'
import { getMigrationInfoParser, SynorMigration } from './migration'

describe('SynorMigration', () => {
  test('returns data (with body)', () => {
    expect(
      SynorMigration(
        {
          version: '0',
          type: 'do',
          title: 'Test',
          filename: '0.do.Test.sql',
          extension: 'sql'
        },
        { body: 'SELECT 1;' }
      )
    ).toMatchSnapshot()
  })

  test('#34 returns data (with run)', () => {
    expect(
      SynorMigration(
        {
          version: '0',
          type: 'do',
          title: 'Test',
          filename: '0.do.Test.sql',
          extension: 'sql'
        },
        { run: () => Promise.resolve() }
      )
    ).toMatchSnapshot()
  })

  describe('getMigrationInfoParser', () => {
    let migrationInfoParser: ReturnType<typeof getMigrationInfoParser>

    beforeAll(() => {
      migrationInfoParser = getMigrationInfoParser({
        do: 'do',
        undo: 'undo',
        separator: '--',
        extension: 'js|sql'
      })
    })

    test('returns migrationInfoParser function', () => {
      expect(migrationInfoParser).toBeInstanceOf(Function)
    })

    test('returned function works (for valid filename)', () => {
      expect(migrationInfoParser('001.do--Test.sql')).toMatchInlineSnapshot(`
        Object {
          "extension": "sql",
          "filename": "001.do--Test.sql",
          "title": "Test",
          "type": "do",
          "version": "001",
        }
      `)

      expect(migrationInfoParser('001.do--Test.js')).toMatchInlineSnapshot(`
        Object {
          "extension": "js",
          "filename": "001.do--Test.js",
          "title": "Test",
          "type": "do",
          "version": "001",
        }
      `)
    })

    test('returned function throws (for invalid filename)', () => {
      try {
        migrationInfoParser('001.do--Test.json')
      } catch (error) {
        expect(error).toBeInstanceOf(SynorError)
        // #28
        expect(error.data).toMatchInlineSnapshot(`
          Object {
            "filename": "001.do--Test.json",
          }
        `)
        expect(error.type).toMatchInlineSnapshot(`"invalid_filename"`)
      }
    })
  })
})
