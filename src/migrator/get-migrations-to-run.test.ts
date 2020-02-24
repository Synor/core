import { SynorError } from '../error'
import { sortVersions } from '../utils/sort'
import { getMigrationInfo, getMigrationRecordInfo } from '../__utils__.test'
import { getMigrationsToRun } from './get-migrations-to-run'

type MigrationInfo = import('../index').MigrationInfo
type MigrationRecordInfo = import('../index').MigrationRecordInfo
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
  },
  '08': {
    do: getMigrationInfo({ version: '08', type: 'do' }),
    undo: getMigrationInfo({ version: '08', type: 'undo' })
  },
  '09': {
    do: getMigrationInfo({ version: '09', type: 'do' }),
    undo: getMigrationInfo({ version: '09', type: 'undo' })
  },
  '10': {
    do: getMigrationInfo({ version: '10', type: 'do' }),
    undo: getMigrationInfo({ version: '10', type: 'undo' })
  },
  '11': {
    do: getMigrationInfo({ version: '11', type: 'do' }),
    undo: getMigrationInfo({ version: '11', type: 'undo' })
  }
}

const versions = sortVersions(Object.keys(infoMap))

const getRecordInfos = (items: string[]): MigrationRecordInfo[] => {
  return items.map((item, index) => {
    const [version, type] = item.split('.') as [
      MigrationRecordInfo['version'],
      MigrationRecordInfo['type']
    ]
    return getMigrationRecordInfo({ id: index + 1, version, type })
  })
}

const formatResult = (items: MigrationSource[]): string[] => {
  return items.map(({ version, type }) => `${version}.${type}`)
}

const getSource = (versions: string[]): SourceEngine => {
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
    read: () => Promise.resolve({ body: '' })
  }

  return source
}

describe('migrator:getMigrationsToRun', () => {
  const source = getSource(versions)

  test('works (from=to)', async () => {
    const result = await getMigrationsToRun({
      recordInfos: getRecordInfos(['0.do', '01.do']),
      source,
      baseVersion: '0',
      targetVersion: '01',
      outOfOrder: false
    })
    expect(formatResult(result)).toMatchInlineSnapshot(`Array []`)
  })

  test('#23 throws if (from<base)', async () => {
    await expect(
      getMigrationsToRun({
        recordInfos: getRecordInfos(['0.do', '01.do']),
        source,
        baseVersion: '02',
        targetVersion: '03',
        outOfOrder: false
      })
    ).rejects.toMatchInlineSnapshot(
      `[SynorError: fromVersion(01) is below baseVersion(02)]`
    )
  })

  test('#23 throws if (to<base)', async () => {
    await expect(
      getMigrationsToRun({
        recordInfos: getRecordInfos(['0.do', '01.do', '02.do', '03.do']),
        source,
        baseVersion: '02',
        targetVersion: '01',
        outOfOrder: false
      })
    ).rejects.toMatchInlineSnapshot(
      `[SynorError: toVersion(01) is below baseVersion(02)]`
    )
  })

  test('throws (from<to ; from not exists)', async () => {
    try {
      await getMigrationsToRun({
        recordInfos: getRecordInfos(['0.do', '01.do']),
        source,
        baseVersion: '0',
        targetVersion: '05',
        outOfOrder: false
      })
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
      await getMigrationsToRun({
        recordInfos: getRecordInfos(['0.do', '01.do', '02.do']),
        source,
        baseVersion: '0',
        targetVersion: '99',
        outOfOrder: false
      })
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
    const result = await getMigrationsToRun({
      recordInfos: getRecordInfos(['0.do', '01.do', '02.do']),
      source,
      baseVersion: '0',
      targetVersion: '04',
      outOfOrder: false
    })
    expect(formatResult(result)).toMatchInlineSnapshot(`
      Array [
        "03.do",
        "04.do",
      ]
    `)
  })

  test('works (from<to ; from is base)', async () => {
    const result = await getMigrationsToRun({
      recordInfos: getRecordInfos(['0.do', '01.do']),
      source,
      baseVersion: '01',
      targetVersion: '04',
      outOfOrder: false
    })
    expect(formatResult(result)).toMatchInlineSnapshot(`
      Array [
        "02.do",
        "03.do",
        "04.do",
      ]
    `)
  })

  test('works (from<to ; not exists in middle)', async () => {
    const result = await getMigrationsToRun({
      recordInfos: getRecordInfos(['0.do', '01.do', '02.do']),
      source,
      baseVersion: '0',
      targetVersion: '07',
      outOfOrder: false
    })
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
      await getMigrationsToRun({
        recordInfos: getRecordInfos(['0.do', '01.do', '99.do']),
        source,
        baseVersion: '0',
        targetVersion: '02',
        outOfOrder: false
      })
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
      await getMigrationsToRun({
        recordInfos: getRecordInfos([
          '0.do',
          '01.do',
          '02.do',
          '03.do',
          '04.do'
        ]),
        source,
        baseVersion: '0',
        targetVersion: '01',
        outOfOrder: false
      })
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
    const result = await getMigrationsToRun({
      recordInfos: getRecordInfos(['0.do', '01.do', '02.do', '03.do', '04.do']),
      source,
      baseVersion: '0',
      targetVersion: '02',
      outOfOrder: false
    })
    expect(formatResult(result)).toMatchInlineSnapshot(`
      Array [
        "04.undo",
        "03.undo",
      ]
    `)
  })

  test('#23 throws (from>to ; from is base)', async () => {
    await expect(
      getMigrationsToRun({
        recordInfos: getRecordInfos(['0.do', '01.do', '02.do', '03.do']),
        source,
        baseVersion: '03',
        targetVersion: '02',
        outOfOrder: false
      })
    ).rejects.toMatchInlineSnapshot(
      `[SynorError: toVersion(02) is below baseVersion(03)]`
    )
  })

  test('works (from>to ; to is base)', async () => {
    const result = await getMigrationsToRun({
      recordInfos: getRecordInfos(['0.do', '01.do', '02.do', '03.do', '04.do']),
      source,
      baseVersion: '01',
      targetVersion: '01',
      outOfOrder: false
    })
    expect(formatResult(result)).toMatchInlineSnapshot(`
      Array [
        "04.undo",
        "03.undo",
        "02.undo",
      ]
    `)
  })

  test('works (from>to ; not exists in middle)', async () => {
    const result = await getMigrationsToRun({
      recordInfos: getRecordInfos([
        '0.do',
        '01.do',
        '02.do',
        '03.do',
        '04.do',
        '05.do',
        '06.do',
        '07.do'
      ]),
      source,
      baseVersion: '0',
      targetVersion: '02',
      outOfOrder: false
    })
    expect(formatResult(result)).toMatchInlineSnapshot(`
      Array [
        "07.undo",
        "06.undo",
      ]
    `)
  })

  test('#22 works (from<to ; from=base ; source: first<base<last)', async () => {
    const result = await getMigrationsToRun({
      recordInfos: getRecordInfos(['0.do', '01.do', '02.do', '03.do']),
      source,
      baseVersion: '03',
      targetVersion: '05',
      outOfOrder: false
    })
    expect(formatResult(result)).toMatchInlineSnapshot(`
      Array [
        "04.do",
        "05.do",
      ]
    `)
  })

  describe('#32 support for out of order migrations', () => {
    const source = getSource(versions.filter(version => version >= '07'))

    test('works (from=to)', async () => {
      const result = await getMigrationsToRun({
        recordInfos: getRecordInfos(['07.do', '10.do']),
        source,
        baseVersion: '0',
        targetVersion: '10',
        outOfOrder: true
      })
      expect(formatResult(result)).toMatchInlineSnapshot(`
        Array [
          "08.do",
          "09.do",
        ]
      `)
    })

    test('works (from<to)', async () => {
      const result = await getMigrationsToRun({
        recordInfos: getRecordInfos(['07.do', '09.do']),
        source,
        baseVersion: '0',
        targetVersion: '11',
        outOfOrder: true
      })
      expect(formatResult(result)).toMatchInlineSnapshot(`
        Array [
          "08.do",
          "10.do",
          "11.do",
        ]
      `)
    })

    test('works (from>to)', async () => {
      const result = await getMigrationsToRun({
        recordInfos: getRecordInfos(['07.do', '09.do', '10.do']),
        source,
        baseVersion: '0',
        targetVersion: '07',
        outOfOrder: true
      })
      expect(formatResult(result)).toMatchInlineSnapshot(`
        Array [
          "10.undo",
          "09.undo",
        ]
      `)
    })
  })
})
