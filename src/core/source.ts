type MigrationInfo = import('./migration-info').MigrationInfo
type SynorConfig = import('..').SynorConfig
type SynorMigrationVersion = import('./migration').SynorMigrationVersion
type SynorMigrationType = import('./migration').SynorMigrationType

export interface SynorSourceEngine {
  open(): Promise<void>
  close(): Promise<void>
  first(): Promise<string | null>
  prev(version: string): Promise<string | null>
  next(version: string): Promise<string | null>
  last(): Promise<string | null>
  get(
    version: SynorMigrationVersion,
    type: SynorMigrationType
  ): Promise<MigrationInfo | null>
  read(migrationInfo: MigrationInfo): Promise<Buffer>
}

export type SourceEngineFactory = (
  uri: SynorConfig['sourceUri'],
  helpers: Pick<SynorConfig, 'migrationInfoParser'>
) => SynorSourceEngine

type SynorSourceConfig = Pick<
  SynorConfig,
  'SourceEngine' | 'sourceUri' | 'migrationInfoParser'
>

export function SynorSource({
  SourceEngine,
  sourceUri,
  migrationInfoParser
}: SynorSourceConfig): SynorSourceEngine {
  return SourceEngine(sourceUri, { migrationInfoParser })
}
