import { getExtendedHistory } from './get-extended-history'
import { getMigration } from './get-migration'

type MigrationRecord = import('../migration').MigrationRecord
type SourceEngine = import('../source').SourceEngine

type Version = MigrationRecord['version']

export async function validateMigrations(
  source: SourceEngine,
  baseVersion: Version,
  history: MigrationRecord[]
): Promise<void> {
  const extendedHistory = getExtendedHistory(baseVersion, history)

  const appliedRecords = extendedHistory.filter(
    ({ state, type }) => type === 'DO' && state === 'applied'
  )

  for (const record of appliedRecords) {
    if (record.version === baseVersion) {
      continue
    }

    const migration = await getMigration(source, record.version, record.type)

    if (!migration) {
      throw new Error(`NOT_FOUND: Migration(${record.version}.${record.type})`)
    }

    if (migration.hash !== record.hash) {
      throw new Error(
        `HASH_MISMATCH: Migration(${record.version}.${record.type})`
      )
    }
  }
}
