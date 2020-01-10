import { SynorError } from '../error'

type MigrationRecord = import('../migration').MigrationRecord
type MigrationSource = import('../migration').MigrationSource

export function validateMigration(
  record: MigrationRecord,
  migration: MigrationSource
): void {
  const { version, type, title } = record

  if (record.dirty) {
    throw new SynorError(
      `Validation Error (dirty) => Version(${version}) Type(${type}) Title(${title})`,
      'dirty',
      record
    )
  }

  if (record.hash !== migration.hash) {
    throw new SynorError(
      `Validation Error (hash_mismatch) => Version(${version}) Type(${type}) Title(${title})`,
      'hash_mismatch',
      record
    )
  }
}
