import { getMigration } from './get-migration'

type MigrationHistory = import('../migration').MigrationHistory
type SourceEngine = import('../source').SourceEngine

type MigrationVersion = MigrationHistory[number]['version']

export async function validateHistory(
  source: SourceEngine,
  baseVersion: MigrationVersion,
  history: MigrationHistory
): Promise<void> {
  const records = history
    .filter(({ state, type }) => state === 'applied' && type === 'DO')
    .reverse()

  for (const { id, version, type, hash, dirty } of records) {
    if (version === baseVersion) {
      continue
    }

    if (dirty) {
      throw new Error(`DIRTY: Record(${id}) Migration(${version}.${type})`)
    }

    const migration = await getMigration(source, version, type)

    if (!migration) {
      throw new Error(`NOT_FOUND: Migration(${version}.${type})`)
    }

    if (migration.hash !== hash) {
      throw new Error(
        `HASH_MISMATCH: Record(${id}) Migration(${version}.${type})`
      )
    }
  }
}
