type MigrationRecordInfo = import('../migration').MigrationRecordInfo

export function getCurrentRecord(
  recordInfos: MigrationRecordInfo[]
): MigrationRecordInfo {
  const appliedMigrations = recordInfos
    .filter(({ state, type }) => state === 'applied' && type === 'do')
    .sort((a, b) => a.id - b.id)

  const currentRecordInfo = appliedMigrations[appliedMigrations.length - 1]

  return currentRecordInfo
}
