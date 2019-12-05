type SynorConfig = import('..').SynorConfig
type MigrationRecord = import('./migration').MigrationRecord
type MigrationSource = import('./migration').MigrationSource

export interface DatabaseEngine {
  open(): Promise<void>
  close(): Promise<void>
  lock(): Promise<void>
  unlock(): Promise<void>
  drop(): Promise<void>
  history(startId?: number): Promise<MigrationRecord[]>
  run(migration: MigrationSource): Promise<void>
}

export type DatabaseEngineFactory = (
  uri: SynorConfig['databaseUri'],
  helpers: Pick<SynorConfig, 'getAdvisoryLockId'>
) => DatabaseEngine

type SynorDatabaseConfig = Pick<
  SynorConfig,
  'DatabaseEngine' | 'databaseUri' | 'getAdvisoryLockId'
>

export function SynorDatabase({
  DatabaseEngine,
  databaseUri,
  getAdvisoryLockId
}: SynorDatabaseConfig): DatabaseEngine {
  return DatabaseEngine(databaseUri, { getAdvisoryLockId })
}
