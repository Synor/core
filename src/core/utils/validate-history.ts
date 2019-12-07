import { SynorMigrationError, SynorValidationError } from 'core/error'
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
      throw new SynorValidationError('DIRTY', { id, version, type })
    }

    const migration = await getMigration(source, version, type)

    if (!migration) {
      throw new SynorMigrationError('NOT_FOUND', { id, version, type })
    }

    if (migration.hash !== hash) {
      throw new SynorValidationError('HASH_MISMATCH', { id, version, type })
    }
  }
}
