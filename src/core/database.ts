type SynorConfig = import('..').SynorConfig
type MigrationRecord = import('./migration').MigrationRecord
type MigrationSource = import('./migration').MigrationSource

type MigrationVersion = MigrationRecord['version']

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
  helpers: Pick<SynorConfig, 'baseVersion' | 'getAdvisoryLockId'>
) => DatabaseEngine

type SynorDatabaseConfig = Pick<
  SynorConfig,
  'DatabaseEngine' | 'databaseUri' | 'baseVersion' | 'getAdvisoryLockId'
>

export function SynorDatabase({
  DatabaseEngine,
  databaseUri,
  baseVersion,
  getAdvisoryLockId
}: SynorDatabaseConfig): DatabaseEngine {
  return DatabaseEngine(databaseUri, { baseVersion, getAdvisoryLockId })
}
