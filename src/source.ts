import { SynorError } from './error'

type MigrationInfo = import('./migration').MigrationInfo
type MigrationSourceContent = import('./migration').MigrationSourceContent
type MigrationType = import('./migration').MigrationType
type SynorConfig = import('.').SynorConfig

export interface SourceEngine {
  /**
   * Opens connection to source
   */
  open(): Promise<void>
  /**
   * Closes connection to source
   */
  close(): Promise<void>
  /**
   * Retrieves the first version
   *
   * @returns first version
   */
  first(): Promise<string | null>
  /**
   * Retrieves the previous version
   *
   * @param version current version
   *
   * @returns previous version
   */
  prev(version: string): Promise<string | null>
  /**
   * Retrieves the next version
   *
   * @param version current version
   *
   * @returns next version
   */
  next(version: string): Promise<string | null>
  /**
   * Retrieves the last version
   *
   * @returns last version
   */
  last(): Promise<string | null>
  /**
   * Retrieves migration information from source
   *
   * @param version migration version
   * @param type migration type
   *
   * @returns migration information
   */
  get(version: string, type: MigrationType): Promise<MigrationInfo | null>
  /**
   * Retrieves the migration content from source
   *
   * @param migrationInfo migration information
   *
   * @returns migration source content
   */
  read(migrationInfo: MigrationInfo): Promise<MigrationSourceContent>
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
