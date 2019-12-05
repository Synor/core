type MigrationRecord = import('../migration').MigrationRecord
type ExtendedMigrationRecord = import('../migration').ExtendedMigrationRecord

type ID = MigrationRecord['id']
type Version = MigrationRecord['version']

export function getExtendedHistory(
  baseVersion: Version,
  history: MigrationRecord[]
): ExtendedMigrationRecord[] {
  const extraInfoById: Record<
    ID,
    Omit<ExtendedMigrationRecord, keyof MigrationRecord>
  > = {}

  const lastRecordIdByVersion: Record<Version, ID> = {}

  for (const { id, version } of history) {
    extraInfoById[id] = {
      state: 'applied',
      revertedBy: null
    }

    if (version === baseVersion) {
      continue
    }

    const prevRecordId = lastRecordIdByVersion[version]

    if (prevRecordId) {
      extraInfoById[prevRecordId].state = 'reverted'
      extraInfoById[prevRecordId].revertedBy = id
    }

    lastRecordIdByVersion[version] = id
  }

  const extendedHistory: ExtendedMigrationRecord[] = history.map(
    ({ id }, index) => ({ ...history[index], ...extraInfoById[id] })
  )

  return extendedHistory
}
