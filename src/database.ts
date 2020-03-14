import { SynorError } from './error'

type MigrationRecord = import('./migration').MigrationRecord
type MigrationSource = import('./migration').MigrationSource
type SynorConfig = import('.').SynorConfig

/**
 * DatabaseEngine is the interface between Synor's core and the target database where the migration will run.
 */
export interface DatabaseEngine {
  /**
   * Opens connection to database
   */
  open(): Promise<void>
  /**
   * Closes connection to database
   */
  close(): Promise<void>
  /**
   * Gets advisory lock
   */
  lock(): Promise<void>
  /**
   * Releases advisory lock
   */
  unlock(): Promise<void>
  /**
   * Drops everything in database
   */
  drop(): Promise<void>
  /**
   * Runs a migration on database and adds migration record
   *
   * @param migration migration to run
   */
  run(migration: MigrationSource): Promise<void>
  /**
   * Repairs migration records
   *
   * @param records records with updated hashes
   */
  repair(records: Array<Pick<MigrationRecord, 'id' | 'hash'>>): Promise<void>
  /**
   * Retrieves migration records
   *
   * @param startId starting ID for the records
   */
  records(startId?: number): Promise<MigrationRecord[]>
}

/**
 * DatabaseEngineFactory returns the DatabaseEngine.
 */
export type DatabaseEngineFactory = (
  uri: SynorConfig['databaseUri'],
  helpers: Pick<
    SynorConfig,
    'baseVersion' | 'getAdvisoryLockId' | 'getUserInfo'
  >
) => DatabaseEngine

type SynorDatabaseConfig = Pick<
  SynorConfig,
  | 'DatabaseEngine'
  | 'databaseUri'
  | 'baseVersion'
  | 'getAdvisoryLockId'
  | 'getUserInfo'
>

export function SynorDatabase({
  DatabaseEngine,
  databaseUri,
  baseVersion,
  getAdvisoryLockId,
  getUserInfo
}: SynorDatabaseConfig): DatabaseEngine {
  if (typeof DatabaseEngine !== 'function') {
    throw new SynorError('Missing DatabaseEngine')
  }

  return DatabaseEngine(databaseUri, {
    baseVersion,
    getAdvisoryLockId,
    getUserInfo
  })
}
