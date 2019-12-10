import { SynorMigrationError } from '../error'
import { getMigration } from './get-migration'

type MigrationHistory = import('../migration').MigrationHistory
type SourceEngine = import('../source').SourceEngine

type MismatchedRecord = Pick<MigrationHistory[number], 'id' | 'hash'>

export async function getRecordsToRepair(
  source: SourceEngine,
  baseVersion: string,
  history: MigrationHistory
): Promise<MismatchedRecord[]> {
  const appliedRecords = history.filter(
    ({ state, dirty }) => state === 'applied' && !dirty
  )

  const mismatchedRecords: MismatchedRecord[] = []

  for (const { id, version, type, hash } of appliedRecords) {
    if (version === baseVersion) {
      continue
    }

    const migration = await getMigration(source, version, type)

    if (!migration) {
      throw new SynorMigrationError('not_found', { id, version, type })
    }

    if (migration.hash !== hash) {
      mismatchedRecords.push({ id, hash: migration.hash })
    }
  }

  return mismatchedRecords
}
