import defaultsDeep from 'lodash.defaultsdeep'
import { getMigrationInfoParser } from './migration'
import { SynorMigrator } from './migrator'
import { getGitUserInfo } from './user-info'
import { getAdvisoryLockId } from './utils/get-advisory-lock-id'

export { DatabaseEngine, DatabaseEngineFactory } from './database'
export { SynorError } from './error'
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
  sourceUri: string
  SourceEngine: SourceEngineFactory
  databaseUri: string
  DatabaseEngine: DatabaseEngineFactory
  baseVersion: string
  recordStartId: number
  migrationInfoNotation: {
    do: string
    undo: string
    separator: string
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
    separator: '.'
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
