import { SynorError } from '../error'
import { getMigrationsToRun } from './get-migrations-to-run'
import { getMigrationInfo } from './index.utils.test'

type MigrationInfo = ReturnType<typeof getMigrationInfo>
type MigrationSource = import('../index').MigrationSource
type SourceEngine = import('../index').SourceEngine

const infoMap: Record<
  MigrationInfo['version'],
  Record<MigrationInfo['type'], MigrationInfo | undefined>
> = {
  '02': {
    do: getMigrationInfo({ version: '02', type: 'do' }),
    undo: getMigrationInfo({ version: '02', type: 'undo' })
  },
  '03': {
    do: getMigrationInfo({ version: '03', type: 'do' }),
    undo: getMigrationInfo({ version: '03', type: 'undo' })
  },
  '04': {
    do: getMigrationInfo({ version: '04', type: 'do' }),
    undo: getMigrationInfo({ version: '04', type: 'undo' })
  },
  '05': {
    do: getMigrationInfo({ version: '05', type: 'do' }),
    undo: undefined
  },
  '06': {
    do: undefined,
    undo: getMigrationInfo({ version: '06', type: 'undo' })
  },
  '07': {
    do: getMigrationInfo({ version: '07', type: 'do' }),
    undo: getMigrationInfo({ version: '07', type: 'undo' })
  }
}
const versions = Object.keys(infoMap)

const formatResult = (items: MigrationSource[]): string[] => {
  return items.map(({ version, type }) => `${version}.${type}`)
}

describe('migrator:getMigrationsToRun', () => {
  const source: SourceEngine = {
    open: () => Promise.resolve(),
    close: () => Promise.resolve(),
    first: () => Promise.resolve(versions[0]),
    prev: (v: MigrationInfo['version']) => {
      const currentIndex = versions.indexOf(v)
      return Promise.resolve(
        currentIndex === -1 ? null : versions[currentIndex - 1] || null
      )
    },
    next: (v: MigrationInfo['version']) => {
      const currentIndex = versions.indexOf(v)
      return Promise.resolve(
        currentIndex === -1 ? null : versions[currentIndex + 1] || null
      )
    },
    last: () => Promise.resolve(versions[versions.length - 1]),
    get: (version: MigrationInfo['version'], type: MigrationInfo['type']) => {
      const m = infoMap[version]
      return Promise.resolve(m ? m[type] || null : null)
    },
    read: () => Promise.resolve(Buffer.from(''))
  }

  test('works (from=to)', async () => {
    const result = await getMigrationsToRun(source as any, '0', '01', '01')
    expect(formatResult(result)).toMatchInlineSnapshot(`Array []`)
  })

  test('#23 throws if (from<base)', async () => {
    await expect(
      getMigrationsToRun(source as any, '02', '01', '03')
    ).rejects.toMatchInlineSnapshot(
      `[SynorError: fromVersion(01) is below baseVersion(02)]`
    )
  })

  test('#23 throws if (to<base)', async () => {
    await expect(
      getMigrationsToRun(source as any, '02', '03', '01')
    ).rejects.toMatchInlineSnapshot(
      `[SynorError: toVersion(01) is below baseVersion(02)]`
    )
  })

  test('throws (from<to ; from not exists)', async () => {
    try {
      await getMigrationsToRun(source as any, '0', '01', '05')
    } catch (error) {
      expect(error).toBeInstanceOf(SynorError)
      expect(error.data).toMatchInlineSnapshot(`
        Object {
          "type": "do",
          "version": "01",
        }
      `)
      expect(error.type).toMatchInlineSnapshot(`"not_found"`)
    }
  })

  test('throws (from<to ; to not exists)', async () => {
    try {
      await getMigrationsToRun(source as any, '0', '02', '99')
    } catch (error) {
      expect(error).toBeInstanceOf(SynorError)
      expect(error.data).toMatchInlineSnapshot(`
        Object {
          "type": "do",
          "version": "99",
        }
      `)
      expect(error.type).toMatchInlineSnapshot(`"not_found"`)
    }
  })

  test('works (from<to)', async () => {
    const result = await getMigrationsToRun(source as any, '0', '02', '04')
    expect(formatResult(result)).toMatchInlineSnapshot(`
      Array [
        "03.do",
        "04.do",
      ]
    `)
  })

  test('works (from<to ; from is base)', async () => {
    const result = await getMigrationsToRun(source as any, '01', '01', '04')
    expect(formatResult(result)).toMatchInlineSnapshot(`
      Array [
        "02.do",
        "03.do",
        "04.do",
      ]
    `)
  })

  test('works (from<to ; not exists in middle)', async () => {
    const result = await getMigrationsToRun(source as any, '0', '02', '07')
    expect(formatResult(result)).toMatchInlineSnapshot(`
      Array [
        "03.do",
        "04.do",
        "05.do",
      ]
    `)
  })

  test('throws (from>to ; from not exists)', async () => {
    try {
      await getMigrationsToRun(source as any, '0', '99', '02')
    } catch (error) {
      expect(error).toBeInstanceOf(SynorError)
      expect(error.data).toMatchInlineSnapshot(`
        Object {
          "type": "undo",
          "version": "99",
        }
      `)
      expect(error.type).toMatchInlineSnapshot(`"not_found"`)
    }
  })

  test('throws (from>to ; to not exists)', async () => {
    try {
      await getMigrationsToRun(source as any, '0', '04', '01')
    } catch (error) {
      expect(error).toBeInstanceOf(SynorError)
      expect(error.data).toMatchInlineSnapshot(`
        Object {
          "type": "undo",
          "version": "01",
        }
      `)
      expect(error.type).toMatchInlineSnapshot(`"not_found"`)
    }
  })

  test('works (from>to)', async () => {
    const result = await getMigrationsToRun(source as any, '0', '04', '02')
    expect(formatResult(result)).toMatchInlineSnapshot(`
      Array [
        "04.undo",
        "03.undo",
      ]
    `)
  })

  test('#23 throws (from>to ; from is base)', async () => {
    await expect(
      getMigrationsToRun(source as any, '03', '03', '02')
    ).rejects.toMatchInlineSnapshot(
      `[SynorError: toVersion(02) is below baseVersion(03)]`
    )
  })

  test('works (from>to ; to is base)', async () => {
    const result = await getMigrationsToRun(source as any, '01', '04', '01')
    expect(formatResult(result)).toMatchInlineSnapshot(`
      Array [
        "04.undo",
        "03.undo",
        "02.undo",
      ]
    `)
  })

  test('works (from>to ; not exists in middle)', async () => {
    const result = await getMigrationsToRun(source as any, '0', '07', '02')
    expect(formatResult(result)).toMatchInlineSnapshot(`
      Array [
        "07.undo",
        "06.undo",
      ]
    `)
  })

  test('#22 works (from<to ; from=base ; source: first<base<last)', async () => {
    const result = await getMigrationsToRun(source as any, '03', '03', '05')
    expect(formatResult(result)).toMatchInlineSnapshot(`
      Array [
        "04.do",
        "05.do",
      ]
    `)
  })
})
