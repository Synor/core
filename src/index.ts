import defaultsDeep from 'lodash.defaultsdeep'
import { getMigrationInfoParser } from './migration'
import { SynorMigrator } from './migrator'
import { getGitUserInfo } from './user-info'
import { getAdvisoryLockId } from './utils/get-advisory-lock-id'

export { DatabaseEngine, DatabaseEngineFactory } from './database'
export { isSynorError, SynorError } from './error'
export {
  MigrationHistory,
  MigrationInfo,
  MigrationInfoParser,
  MigrationRecord,
  MigrationSource
} from './migration'
export { SourceEngine, SourceEngineFactory } from './source'
export { getGitUserInfo, GetUserInfo } from './user-info'
export { GetAdvisoryLockId } from './utils/get-advisory-lock-id'
export { sortVersions } from './utils/sort-versions'

type DatabaseEngineFactory = import('./database').DatabaseEngineFactory
type GetAdvisoryLockId = import('./utils/get-advisory-lock-id').GetAdvisoryLockId
type GetUserInfo = import('./user-info').GetUserInfo
type MigrationInfoParser = import('./migration').MigrationInfoParser
type SourceEngineFactory = import('./source').SourceEngineFactory

type Synor = {
  migrator: SynorMigrator
}

export type SynorConfig = {
  SourceEngine: SourceEngineFactory
  /**
   * Source URI
   */
  sourceUri: string
  DatabaseEngine: DatabaseEngineFactory
  /**
   * Database URI
   */
  databaseUri: string
  /**
   * Specifies the base migration version
   */
  baseVersion: string
  /**
   * If specified, all the migration records before this ID is ignored
   */
  recordStartId: number
  /**
   * Modifies the behavior of the default `migrationInfoParser` function
   */
  migrationInfoNotation: {
    /**
     * Notation for the DO `Type` migration
     */
    do: string
    /**
     * Notation for the UNDO `Type` migration
     */
    undo: string
    /**
     * Separator between `Version.Type` and `Title.Extension` of the migration filename
     */
    separator: string
    /**
     * Regular expression pattern for filename extension
     */
    extension: string
  }
  migrationInfoParser: MigrationInfoParser
  getAdvisoryLockId: GetAdvisoryLockId
  getUserInfo: GetUserInfo
}

const defaultConfig: Partial<SynorConfig> = {
  baseVersion: '0',
  recordStartId: 0,
  migrationInfoNotation: {
    do: 'do',
    undo: 'undo',
    separator: '.',
    extension: '.+'
  },
  getAdvisoryLockId,
  getUserInfo: getGitUserInfo
}

export function Synor(synorConfig: Partial<SynorConfig>): Synor {
  const config: SynorConfig = defaultsDeep(synorConfig, defaultConfig)

  if (typeof config.migrationInfoParser !== 'function') {
    config.migrationInfoParser = getMigrationInfoParser(
      config.migrationInfoNotation
    )
  }

  const migrator = new SynorMigrator(config)

  return {
    migrator
  }
}
