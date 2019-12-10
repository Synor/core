type MigrationRecord = import('./migration').MigrationRecord
type MigrationSource = import('./migration').MigrationSource
type SynorConfig = import('.').SynorConfig

export interface DatabaseEngine {
  open(): Promise<void>
  close(): Promise<void>
  lock(): Promise<void>
  unlock(): Promise<void>
  drop(): Promise<void>
  run(migration: MigrationSource): Promise<void>
  repair(records: Array<Pick<MigrationRecord, 'id' | 'hash'>>): Promise<void>
  records(startId?: number): Promise<MigrationRecord[]>
}

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
  return DatabaseEngine(databaseUri, {
    baseVersion,
    getAdvisoryLockId,
    getUserInfo
  })
}
