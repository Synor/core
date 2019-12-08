import { SynorValidationError } from 'core/error'

type MigrationSource = import('../migration').MigrationSource
type MigrationRecord = import('../migration').MigrationRecord

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
