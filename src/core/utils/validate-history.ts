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

  for (const record of records) {
    const { version, type, hash, dirty } = record

    if (version === baseVersion) {
      continue
    }

    if (dirty) {
      throw new SynorValidationError('dirty', record)
    }

    const migration = await getMigration(source, version, type)

    if (!migration) {
      throw new SynorMigrationError('not_found', record)
    }

    if (migration.hash !== hash) {
      throw new SynorValidationError('hash_mismatch', record)
    }
  }
}
