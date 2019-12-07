import { getMigration } from './get-migration'

type MigrationHistory = import('../migration').MigrationHistory
type SourceEngine = import('../source').SourceEngine

type MigrationVersion = MigrationHistory[number]['version']

export async function validateMigrations(
  source: SourceEngine,
  baseVersion: MigrationVersion,
  history: MigrationHistory
): Promise<void> {
  const appliedRecords = history.filter(
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
