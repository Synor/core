import { sortMigrations } from '../utils/sort'

type MigrationRecordInfo = import('../migration').MigrationRecordInfo

export function getCurrentRecord(
  recordInfos: MigrationRecordInfo[]
): MigrationRecordInfo {
  const appliedMigrations = sortMigrations(
    recordInfos.filter(
      ({ state, type }) => state === 'applied' && type === 'do'
    )
  )

  const currentRecordInfo = appliedMigrations[appliedMigrations.length - 1]

  return currentRecordInfo
}
