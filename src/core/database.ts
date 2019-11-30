type SynorConfig = import('..').SynorConfig
type SynorMigration = import('./migration').SynorMigration
type SynorMigrationRecord = import('./migration').SynorMigrationRecord

export interface SynorDatabaseEngine {
  open(): Promise<void>
  close(): Promise<void>
  lock(): Promise<void>
  unlock(): Promise<void>
  drop(): Promise<void>
  history(startId?: number): Promise<SynorMigrationRecord[]>
  run(migration: SynorMigration): Promise<void>
}

export type DatabaseEngineFactory = (
  uri: SynorConfig['databaseUri'],
  helpers: Pick<SynorConfig, 'getAdvisoryLockId'>
) => SynorDatabaseEngine

type SynorDatabaseConfig = Pick<
  SynorConfig,
  'DatabaseEngine' | 'databaseUri' | 'getAdvisoryLockId'
>

export function SynorDatabase({
  DatabaseEngine,
  databaseUri,
  getAdvisoryLockId
}: SynorDatabaseConfig): SynorDatabaseEngine {
  return DatabaseEngine(databaseUri, { getAdvisoryLockId })
}
