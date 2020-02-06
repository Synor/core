type MigrationInfo = import('./index').MigrationInfo
type MigrationRecord = import('./index').MigrationRecord
type MigrationRecordInfo = import('./index').MigrationRecordInfo
type MigrationSource = import('./index').MigrationSource

const dummyMigrationRecordInfo: MigrationRecordInfo = {
  id: 0,
  version: '0',
  type: 'do',
  title: '',
  hash: '',
  appliedAt: new Date('2020-01-01T00:00:00.000Z'),
  appliedBy: 'Jest',
  executionTime: 0,
  dirty: false,
  state: 'applied',
  revertedBy: null
}

export const getMigrationRecordInfo = (
  recordInfo: Partial<MigrationRecordInfo>
): MigrationRecordInfo => ({
  ...dummyMigrationRecordInfo,
  ...recordInfo
})

const dummyMigrationRecord: MigrationRecord = {
  id: 0,
  version: '0',
  type: 'do',
  title: '',
  hash: '',
  appliedAt: new Date('2020-01-01T00:00:00.000Z'),
  appliedBy: 'Jest',
  executionTime: 0,
  dirty: false
}

export const getMigrationRecord = (
  record: Partial<MigrationRecord>
): MigrationRecord => ({
  ...dummyMigrationRecord,
  ...record
})

const dummyMigrationSource: MigrationSource = {
  version: '0',
  type: 'do',
  title: '',
  body: '',
  hash: ''
}

export const getMigrationSource = (
  source: Partial<MigrationSource>
): MigrationSource => ({
  ...dummyMigrationSource,
  ...source
})

const dummyMigrationInfo: MigrationInfo = {
  version: '0',
  type: 'do',
  title: '',
  filename: ''
}

export const getMigrationInfo = (
  info: Partial<MigrationInfo>
): MigrationInfo => ({
  ...dummyMigrationInfo,
  ...info
})
