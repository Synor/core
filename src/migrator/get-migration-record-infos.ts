type DatabaseEngine = import('../database').DatabaseEngine
type MigrationRecord = import('../migration').MigrationRecord
type MigrationRecordInfo = import('../migration').MigrationRecordInfo

type RecordID = MigrationRecord['id']

export async function getMigrationRecordInfos(
  database: DatabaseEngine,
  baseVersion: string,
  recordStartId: RecordID
): Promise<MigrationRecordInfo[]> {
  const records = await database.records(recordStartId)

  const lastIndexByVersion: Record<string, number> = {}

  const recordInfos: MigrationRecordInfo[] = records.map(record => ({
    ...record,
    state: 'applied',
    revertedBy: null
  }))

  recordInfos.forEach(({ id, version }, index) => {
    if (version === baseVersion) {
      return
    }

    const lastIndex = lastIndexByVersion[version]

    if (lastIndex) {
      recordInfos[lastIndex].state = 'reverted'
      recordInfos[lastIndex].revertedBy = id
    }

    lastIndexByVersion[version] = index
  })

  return recordInfos
}
