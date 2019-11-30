import { getHash } from 'core/utils/get-hash'

type MigrationInfo = import('./migration-info').MigrationInfo

export type SynorMigrationType = 'DO' | 'UNDO'
export type SynorMigrationVersion = string

export interface SynorMigrationRecord {
  id: number
  version: SynorMigrationVersion
  type: SynorMigrationType
  title: string
  hash: string
  appliedAt: Date
  appliedBy: string
  executionTime: number
}

export type SynorMigrationRecordState = 'applied' | 'reverted'

export type SynorMigrationExtendedRecord = SynorMigrationRecord & {
  state: SynorMigrationRecordState
  revertedBy: number | null
}

export type SynorMigration = {
  version: SynorMigrationVersion
  type: SynorMigrationType
  title: string
  hash: string
  body: string
}

export function SynorMigration(
  { version, type, title }: MigrationInfo,
  content: Buffer
): SynorMigration {
  const migration: SynorMigration = {
    version,
    type,
    title,
    get hash() {
      return getHash(this.body)
    },
    get body() {
      return content.toString('utf8')
    }
  }

  return migration
}
