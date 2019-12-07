import defaultsDeep from 'lodash.defaultsdeep'
import { getMigrationInfoParser } from './core/migration'
import { SynorMigrator } from './core/migrator'
import { getAdvisoryLockId } from './utils/get-advisory-lock-id'

type DatabaseEngineFactory = import('./core/database').DatabaseEngineFactory
type GetAdvisoryLockId = import('./utils/get-advisory-lock-id').GetAdvisoryLockId
type MigrationInfoParser = import('./core/migration').MigrationInfoParser
type MigrationVersion = import('./core/migration').MigrationVersion
type SourceEngineFactory = import('./core/source').SourceEngineFactory

type Synor = {
  migrator: SynorMigrator
}

export type SynorConfig = {
  sourceUri: string
  SourceEngine: SourceEngineFactory
  databaseUri: string
  DatabaseEngine: DatabaseEngineFactory
  baseVersion: MigrationVersion
  migrationInfoNotation: {
    do: string
    undo: string
    seperator: string
  }
  migrationInfoParser: MigrationInfoParser
  getAdvisoryLockId: GetAdvisoryLockId
  recordStartId: number
}

const defaultConfig: Partial<SynorConfig> = {
  baseVersion: '0',
  migrationInfoNotation: {
    do: 'do',
    undo: 'undo',
    seperator: '.'
  },
  getAdvisoryLockId,
  recordStartId: 0
}

export function Synor(synorConfig: Partial<SynorConfig>): Synor {
  const config: SynorConfig = defaultsDeep(synorConfig, defaultConfig)

  if (typeof config.migrationInfoParser !== 'function') {
    config.migrationInfoParser = getMigrationInfoParser(config)
  }

  const migrator = SynorMigrator(config)

  return {
    migrator
  }
}
