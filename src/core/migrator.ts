import { SynorDatabase } from 'core/database'
import { SynorSource } from 'core/source'
import { getCurrentVersion } from 'core/utils/get-current-version'
import { getMigrationsToRun } from 'core/utils/get-migrations-to-run'
import { validateHistory } from 'core/utils/validate-history'
import { getHistory } from './utils/get-history'
import { getRecordsToRepair } from './utils/get-records-to-repair'

type SynorConfig = import('..').SynorConfig
type MigrationSource = import('./migration').MigrationSource
type MigrationHistory = import('./migration').MigrationHistory

export type SynorMigrator = {
  open: () => Promise<void>
  close: () => Promise<void>
  drop: () => Promise<void>
  version: () => Promise<string>
  history: (recordStartId?: number) => Promise<MigrationHistory>
  pending: () => Promise<MigrationSource[]>
  validate: () => Promise<void>
  migrate: (targetVersion: string) => Promise<void>
  repair: () => Promise<void>
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
    const { baseVersion, recordStartId } = config

    try {
      await lock()
      const history = await getHistory(database, baseVersion, recordStartId)
      const currentVersion = getCurrentVersion(history)
      return currentVersion
    } finally {
      await unlock()
    }
  }

  const history: SynorMigrator['history'] = async (
    recordStartId = config.recordStartId
  ) => {
    const { baseVersion } = config

    try {
      await lock()
      const history = await getHistory(database, baseVersion, recordStartId)
      return history
    } finally {
      await unlock()
    }
  }

  const pending: SynorMigrator['pending'] = async () => {
    const { baseVersion, recordStartId } = config

    try {
      await lock()
      const history = await getHistory(database, baseVersion, recordStartId)
      const currentVersion = getCurrentVersion(history)
      const targetVersion = await source.last()

      if (!targetVersion || currentVersion >= targetVersion) {
        return []
      }

      const migrations = await getMigrationsToRun(
        source,
        config.baseVersion,
        currentVersion,
        targetVersion
      )

      return migrations
    } finally {
      await unlock()
    }
  }

  const validate: SynorMigrator['validate'] = async () => {
    const { baseVersion, recordStartId } = config

    try {
      await lock()
      const history = await getHistory(database, baseVersion, recordStartId)
      await validateHistory(source, baseVersion, history)
    } finally {
      await unlock()
    }
  }

  const migrate: SynorMigrator['migrate'] = async (targetVersion: string) => {
    const { baseVersion, recordStartId } = config

    try {
      await lock()
      const history = await getHistory(database, baseVersion, recordStartId)
      await validateHistory(source, baseVersion, history)
      const currentVersion = getCurrentVersion(history)
      const migrations = await getMigrationsToRun(
        source,
        baseVersion,
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

  const repair: SynorMigrator['repair'] = async () => {
    const { baseVersion, recordStartId } = config

    try {
      await lock()
      const history = await getHistory(database, baseVersion, recordStartId)
      const records = await getRecordsToRepair(source, baseVersion, history)
      await database.repair(records)
    } finally {
      await unlock()
    }
  }

  return {
    open,
    close,
    drop,
    version,
    history,
    pending,
    validate,
    migrate,
    repair
  }
}
