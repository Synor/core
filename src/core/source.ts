type MigrationInfo = import('./migration').MigrationInfo
type SynorConfig = import('..').SynorConfig

type MigrationType = MigrationInfo['type']
type MigrationVersion = MigrationInfo['version']

export interface SourceEngine {
  open(): Promise<void>
  close(): Promise<void>
  first(): Promise<string | null>
  prev(version: string): Promise<string | null>
  next(version: string): Promise<string | null>
  last(): Promise<string | null>
  get(
    version: MigrationVersion,
    type: MigrationType
  ): Promise<MigrationInfo | null>
  read(migrationInfo: MigrationInfo): Promise<Buffer>
}

export type SourceEngineFactory = (
  uri: SynorConfig['sourceUri'],
  helpers: Pick<SynorConfig, 'migrationInfoParser'>
) => SourceEngine

type SynorSourceConfig = Pick<
  SynorConfig,
  'SourceEngine' | 'sourceUri' | 'migrationInfoParser'
>

export function SynorSource({
  SourceEngine,
  sourceUri,
  migrationInfoParser
}: SynorSourceConfig): SourceEngine {
  return SourceEngine(sourceUri, { migrationInfoParser })
}
