type DatabaseEngine = import('../database').DatabaseEngine
type MigrationRecord = import('../migration').MigrationRecord
type MigrationHistory = import('../migration').MigrationHistory

type MigrationVersion = MigrationRecord['version']
type RecordID = MigrationRecord['id']

export async function getHistory(
  database: DatabaseEngine,
  baseVersion: MigrationVersion,
  recordStartId: RecordID
): Promise<MigrationHistory> {
  const records = await database.records(recordStartId)

  const lastIndexByVersion: Record<MigrationVersion, number> = {}

  const history: MigrationHistory = records.map(record => ({
    ...record,
    state: 'applied',
    revertedBy: null
  }))

  history.forEach(({ id, version }, index) => {
    if (version === baseVersion) {
      return
    }

    const lastIndex = lastIndexByVersion[version]

    if (lastIndex) {
      history[lastIndex].state = 'reverted'
      history[lastIndex].revertedBy = id
    }

    lastIndexByVersion[version] = index
  })

  return history
}
