import { getExtendedHistory } from './get-extended-history'
import { getMigration } from './get-migration'

type MigrationRecord = import('../migration').MigrationRecord
type SourceEngine = import('../source').SourceEngine

type Version = MigrationRecord['version']

export async function getRecordsToRepair(
  source: SourceEngine,
  baseVersion: Version,
  history: MigrationRecord[]
): Promise<Array<Pick<MigrationRecord, 'id' | 'hash'>>> {
  const extendedHistory = getExtendedHistory(baseVersion, history)

  const appliedRecords = extendedHistory.filter(
    ({ state, dirty }) => state === 'applied' && !dirty
  )

  const recordsToRepair: Array<Pick<MigrationRecord, 'id' | 'hash'>> = []

  for (const { id, version, type, hash } of appliedRecords) {
    const migration = await getMigration(source, version, type)

    if (!migration) {
      throw new Error(`NOT_FOUND: Migration(${version}.${type})`)
    }

    if (migration.hash !== hash) {
      recordsToRepair.push({ id, hash: migration.hash })
    }
  }

  return recordsToRepair
}
