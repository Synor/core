import { SynorError } from './error'

type MigrationInfo = import('./migration').MigrationInfo
type MigrationType = import('./migration').MigrationType
type SynorConfig = import('.').SynorConfig

export interface SourceEngine {
  open(): Promise<void>
  close(): Promise<void>
  first(): Promise<string | null>
  prev(version: string): Promise<string | null>
  next(version: string): Promise<string | null>
  last(): Promise<string | null>
  get(version: string, type: MigrationType): Promise<MigrationInfo | null>
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
  if (typeof SourceEngine !== 'function') {
    throw new SynorError('Missing SourceEngine')
  }

  return SourceEngine(sourceUri, {
    migrationInfoParser
  })
}
