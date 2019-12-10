import { SynorValidationError } from '../error'

type MigrationRecord = import('../migration').MigrationRecord
type MigrationSource = import('../migration').MigrationSource

export function validateMigration(
  record: MigrationRecord,
  migration: MigrationSource
): void {
  if (record.dirty) {
    throw new SynorValidationError('dirty', record)
  }

  if (record.hash !== migration.hash) {
    throw new SynorValidationError('hash_mismatch', record)
  }
}
