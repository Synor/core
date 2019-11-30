import { SynorDatabase } from 'core/database'
import { SynorSource } from 'core/source'
import { getCurrentVersion } from 'core/utils/get-current-version'
import { getMigrationsToRun } from 'core/utils/get-migrations-to-run'
import { validateMigrations } from 'core/utils/validate-migrations'
import { getExtendedHistory } from './utils/get-extended-history'

type SynorConfig = import('..').SynorConfig
type SynorMigration = import('./migration').SynorMigration
type SynorMigrationExtendedRecord = import('./migration').SynorMigrationExtendedRecord

export type SynorMigrator = {
  open: () => Promise<void>
  close: () => Promise<void>
  drop: () => Promise<void>
  version: () => Promise<string>
  validate: () => Promise<void>
  migrate: (targetVersion: string) => Promise<void>
  history: () => Promise<SynorMigrationExtendedRecord[]>
  pending: () => Promise<SynorMigration[]>
}

export function SynorMigrator(config: SynorConfig): SynorMigrator {
  const database = SynorDatabase(config)
  const source = SynorSource(config)

  let locked = false

  async function lock(): Promise<void> {
    if (locked) {
      throw new Error('ALREADY_LOCKED')
    }

    await database.lock()

    locked = true
  }

  async function unlock(): Promise<void> {
    if (!locked) {
      throw new Error('NOT_LOCKED')
    }

    await database.unlock()

    locked = false
  }

  const open: SynorMigrator['open'] = async () => {
    await Promise.all([database.open(), source.open()])
  }

  const close: SynorMigrator['close'] = async () => {
    await Promise.all([database.close(), source.close()])
  }

  const drop: SynorMigrator['drop'] = async () => {
    try {
      await lock()
      await database.drop()
    } finally {
      await unlock()
    }
  }

  const version: SynorMigrator['version'] = async () => {
    try {
      await lock()
      const history = await database.history(config.historyStartId)
      const currentVersion = getCurrentVersion(history)
      return currentVersion
    } finally {
      await unlock()
    }
  }

  const validate: SynorMigrator['validate'] = async () => {
    try {
      await lock()
      const history = await database.history(config.historyStartId)
      await validateMigrations(source, config.initialVersion, history)
    } finally {
      await unlock()
    }
  }

  const migrate: SynorMigrator['migrate'] = async (targetVersion: string) => {
    try {
      await lock()
      const history = await database.history(config.historyStartId)
      await validateMigrations(source, config.initialVersion, history)
      const currentVersion = getCurrentVersion(history)

      const migrations = await getMigrationsToRun(
        source,
        config.initialVersion,
        currentVersion,
        targetVersion
      )

      for (const migration of migrations) {
        await database.run(migration)
      }
    } finally {
      await unlock()
    }
  }

  const history: SynorMigrator['history'] = async () => {
    try {
      await lock()
      const history = await database.history(config.historyStartId)
      const extendedHistory = getExtendedHistory(config.initialVersion, history)
      return extendedHistory
    } finally {
      await unlock()
    }
  }

  const pending: SynorMigrator['pending'] = async () => {
    try {
      await lock()
      const history = await database.history(config.historyStartId)
      const currentVersion = getCurrentVersion(history)
      const targetVersion = await source.last()

      if (!targetVersion || currentVersion >= targetVersion) {
        return []
      }

      const migrations = await getMigrationsToRun(
        source,
        config.initialVersion,
        currentVersion,
        targetVersion
      )

      return migrations
    } finally {
      await unlock()
    }
  }

  return {
    open,
    close,
    drop,
    version,
    validate,
    migrate,
    history,
    pending
  }
}
