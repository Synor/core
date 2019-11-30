import { getExtendedHistory } from './get-extended-history'
import { getMigration } from './get-migration'

type SynorMigrationRecord = import('../migration').SynorMigrationRecord
type SynorSourceEngine = import('../source').SynorSourceEngine

type Version = SynorMigrationRecord['version']

export async function validateMigrations(
  source: SynorSourceEngine,
  initialVersion: Version,
  history: SynorMigrationRecord[]
): Promise<void> {
  const extendedHistory = getExtendedHistory(initialVersion, history)

  const appliedRecords = extendedHistory.filter(
    ({ state, type }) => type === 'DO' && state === 'applied'
  )

  for (const record of appliedRecords) {
    if (record.version === initialVersion) {
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
