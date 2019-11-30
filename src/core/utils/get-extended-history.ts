type SynorMigrationRecord = import('../migration').SynorMigrationRecord
type SynorMigrationExtendedRecord = import('../migration').SynorMigrationExtendedRecord

type RecordID = SynorMigrationRecord['id']
type Version = SynorMigrationRecord['version']

export function getExtendedHistory(
  initialVersion: string,
  history: SynorMigrationRecord[]
): SynorMigrationExtendedRecord[] {
  const extraInfoById: Record<
    RecordID,
    Omit<SynorMigrationExtendedRecord, keyof SynorMigrationRecord>
  > = {}

  const lastRecordIdByVersion: Record<Version, RecordID> = {}

  for (const { id, version } of history) {
    extraInfoById[id] = {
      state: 'applied',
      revertedBy: null
    }

    if (version === initialVersion) {
      continue
    }

    const prevRecordId = lastRecordIdByVersion[version]

    if (prevRecordId) {
      extraInfoById[prevRecordId].state = 'reverted'
      extraInfoById[prevRecordId].revertedBy = id
    }

    lastRecordIdByVersion[version] = id
  }

  const extendedHistory: SynorMigrationExtendedRecord[] = history.map(
    ({ id }, index) => ({ ...history[index], ...extraInfoById[id] })
  )

  return extendedHistory
}
