import { MigrationSource } from '../migration'
import { getMigrationRecord, getMigrationSource } from '../__utils__.test'
import { sortMigrations, sortVersions } from './sort'

type MigrationRecord = import('../migration').MigrationRecord

const versions = ['004', '002', '001', '003', '002']
const ascVersions = ['001', '002', '002', '003', '004']
const descVersions = ['004', '003', '002', '002', '001']

describe('utils:sortVersions', () => {
  test('sorts (default: ASC)', () => {
    expect(sortVersions(versions)).toEqual(ascVersions)
  })

  test('sorts (ASC)', () => {
    expect(sortVersions(versions, 'ASC')).toEqual(ascVersions)
  })

  test('sorts (DESC)', () => {
    expect(sortVersions(versions, 'DESC')).toEqual(descVersions)
  })

  test('does not mutate input', () => {
    const input = versions
    const output = sortVersions(input)
    expect(input).not.toEqual(output)
  })
})

const migrations: Array<MigrationRecord | MigrationSource> = [
  getMigrationRecord({ id: 1, version: '01', type: 'do' }),
  getMigrationRecord({ id: 2, version: '01', type: 'undo' }),
  getMigrationRecord({ id: 3, version: '01', type: 'do' }),
  getMigrationRecord({ id: 4, version: '02', type: 'do' }),
  getMigrationRecord({ id: 5, version: '02', type: 'undo' }),
  getMigrationRecord({ id: 6, version: '03', type: 'do' }),
  getMigrationRecord({ id: 7, version: '03', type: 'undo' }),
  getMigrationRecord({ id: 8, version: '03', type: 'do' }),
  getMigrationRecord({ id: 9, version: '02', type: 'do' }),
  getMigrationSource({ version: '04', type: 'do' }),
  getMigrationSource({ version: '04', type: 'undo' }),
  getMigrationSource({ version: '05', type: 'do' })
]
const unsortedMigrations: Array<MigrationRecord | MigrationSource> = [
  migrations[0],
  migrations[2],
  migrations[1],
  migrations[10],
  migrations[3],
  migrations[6],
  migrations[11],
  migrations[4],
  migrations[5],
  migrations[9],
  migrations[8],
  migrations[7]
]
const ascMigrations: Array<MigrationRecord | MigrationSource> = [
  getMigrationRecord({ id: 1, version: '01', type: 'do' }),
  getMigrationRecord({ id: 2, version: '01', type: 'undo' }),
  getMigrationRecord({ id: 3, version: '01', type: 'do' }),
  getMigrationRecord({ id: 4, version: '02', type: 'do' }),
  getMigrationRecord({ id: 5, version: '02', type: 'undo' }),
  getMigrationRecord({ id: 9, version: '02', type: 'do' }),
  getMigrationRecord({ id: 6, version: '03', type: 'do' }),
  getMigrationRecord({ id: 7, version: '03', type: 'undo' }),
  getMigrationRecord({ id: 8, version: '03', type: 'do' }),
  getMigrationSource({ version: '04', type: 'do' }),
  getMigrationSource({ version: '04', type: 'undo' }),
  getMigrationSource({ version: '05', type: 'do' })
]
const descMigrations: Array<MigrationRecord | MigrationSource> = [
  getMigrationSource({ version: '05', type: 'do' }),
  getMigrationSource({ version: '04', type: 'do' }),
  getMigrationSource({ version: '04', type: 'undo' }),
  getMigrationRecord({ id: 8, version: '03', type: 'do' }),
  getMigrationRecord({ id: 7, version: '03', type: 'undo' }),
  getMigrationRecord({ id: 6, version: '03', type: 'do' }),
  getMigrationRecord({ id: 9, version: '02', type: 'do' }),
  getMigrationRecord({ id: 5, version: '02', type: 'undo' }),
  getMigrationRecord({ id: 4, version: '02', type: 'do' }),
  getMigrationRecord({ id: 3, version: '01', type: 'do' }),
  getMigrationRecord({ id: 2, version: '01', type: 'undo' }),
  getMigrationRecord({ id: 1, version: '01', type: 'do' })
]

describe('utils:sortMigrations', () => {
  test('sorts (default: ASC)', () => {
    expect(sortMigrations(unsortedMigrations)).toEqual(ascMigrations)
  })

  test('sorts (ASC)', () => {
    expect(sortMigrations(unsortedMigrations, 'ASC')).toEqual(ascMigrations)
  })

  test('sorts (DESC)', () => {
    expect(sortMigrations(unsortedMigrations, 'DESC')).toEqual(descMigrations)
  })

  test('does not mutate input', () => {
    const input = unsortedMigrations
    const output = sortMigrations(input)
    expect(input).not.toEqual(output)
  })
})
