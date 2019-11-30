import defaultsDeep from 'lodash.defaultsdeep'
import { getMigrationInfoParser } from './core/migration-info'
import { SynorMigrator } from './core/migrator'
import { getAdvisoryLockId } from './utils/get-advisory-lock-id'

type SynorMigrationVersion = import('./core/migration').SynorMigrationVersion
type DatabaseEngineFactory = import('./core/database').DatabaseEngineFactory
type GetAdvisoryLockId = import('./utils/get-advisory-lock-id').GetAdvisoryLockId
type MigrationInfoParser = import('./core/migration-info').MigrationInfoParser
type SourceEngineFactory = import('./core/source').SourceEngineFactory

type Synor = {
  migrator: SynorMigrator
}

export type SynorConfig = {
  sourceUri: string
  SourceEngine: SourceEngineFactory
  databaseUri: string
  DatabaseEngine: DatabaseEngineFactory
  initialVersion: SynorMigrationVersion
  migrationInfoNotation: {
    do: string
    undo: string
    extension: string | string[]
    seperator: string
  }
  migrationInfoParser: MigrationInfoParser
  getAdvisoryLockId: GetAdvisoryLockId
  historyStartId: number
}

const defaultConfig: Partial<SynorConfig> = {
  initialVersion: '0',
  migrationInfoNotation: {
    do: 'do',
    undo: 'undo',
    extension: ['sql'],
    seperator: '.'
  },
  getAdvisoryLockId,
  historyStartId: 0
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
