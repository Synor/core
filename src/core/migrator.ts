import { SynorDatabase } from 'core/database'
import {
  SynorError,
  SynorMigrationError,
  SynorValidationError
} from 'core/error'
import { SynorSource } from 'core/source'
import { getCurrentVersion } from 'core/utils/get-current-version'
import { getMigration } from 'core/utils/get-migration'
import { getMigrationsToRun } from 'core/utils/get-migrations-to-run'
import { validateMigration } from 'core/utils/validate-migration'
import { SynorEventEmitter } from './event-emitter'
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
  on: ReturnType<typeof SynorEventEmitter>['on']
}

export function SynorMigrator(config: SynorConfig): SynorMigrator {
  const { emit, on } = SynorEventEmitter()

  const database = SynorDatabase(config)
  const source = SynorSource(config)

  let locked = false

  async function lock(): Promise<void> {
    emit('lock:start')

    if (locked) {
      throw new SynorError('Already Locked')
    }

    await database.lock()

    locked = true

    emit('lock:end')
  }

  async function unlock(): Promise<void> {
    emit('unlock:start')

    if (!locked) {
      throw new SynorError('Not Locked')
    }

    await database.unlock()

    locked = false

    emit('unlock:end')
  }

  const open: SynorMigrator['open'] = async () => {
    emit('open:start')

    await Promise.all([database.open(), source.open()])

    emit('open:end')
  }

  const close: SynorMigrator['close'] = async () => {
    emit('close:start')

    await Promise.all([database.close(), source.close()])

    emit('close:end')
  }

  const drop: SynorMigrator['drop'] = async () => {
    try {
      await lock()

      emit('drop:start')

      await database.drop()
    } finally {
      emit('drop:end')

      await unlock()
    }
  }

  const version: SynorMigrator['version'] = async () => {
    const { baseVersion, recordStartId } = config

    try {
      await lock()

      emit('version:start')

      const history = await getHistory(database, baseVersion, recordStartId)
      const currentVersion = getCurrentVersion(history)

      emit('version', currentVersion)

      return currentVersion
    } finally {
      emit('version:end')

      await unlock()
    }
  }

  const history: SynorMigrator['history'] = async (
    recordStartId = config.recordStartId
  ) => {
    const { baseVersion } = config

    try {
      await lock()

      emit('history:start')

      const history = await getHistory(database, baseVersion, recordStartId)

      emit('history', history)

      return history
    } finally {
      emit('history:end')

      await unlock()
    }
  }

  const pending: SynorMigrator['pending'] = async () => {
    const { baseVersion, recordStartId } = config

    try {
      await lock()

      emit('pending:start')

      const history = await getHistory(database, baseVersion, recordStartId)
      const currentVersion = getCurrentVersion(history)
      const targetVersion = await source.last()

      if (!targetVersion || currentVersion >= targetVersion) {
        emit('pending', [])

        return []
      }

      const migrations = await getMigrationsToRun(
        source,
        baseVersion,
        currentVersion,
        targetVersion
      )

      emit('pending', migrations)

      return migrations
    } finally {
      emit('pending:end')

      await unlock()
    }
  }

  const validate: SynorMigrator['validate'] = async () => {
    const { baseVersion, recordStartId } = config

    try {
      await lock()

      emit('validate:start')

      const records = await getHistory(
        database,
        baseVersion,
        recordStartId
      ).then(history =>
        history.filter(
          ({ version, type, state }) =>
            version !== baseVersion && type === 'DO' && state === 'applied'
        )
      )

      const validationErrors: SynorValidationError[] = []

      for (const record of records) {
        emit('validate:run:start', record)

        const migration = await getMigration(
          source,
          record.version,
          record.type
        )

        if (!migration) {
          throw new SynorMigrationError('not_found', record)
        }

        try {
          validateMigration(record, migration)
        } catch (err) {
          if (err instanceof SynorValidationError) {
            emit('validate:error', err.meta, err.type)
            validationErrors.push(err)
          } else {
            throw err
          }
        }

        emit('validate:run:end', record)
      }

      if (validationErrors.length) {
        throw validationErrors
      }
    } finally {
      emit('validate:end')

      await unlock()
    }
  }

  const migrate: SynorMigrator['migrate'] = async (targetVersion: string) => {
    const { baseVersion, recordStartId } = config

    try {
      await lock()

      emit('migrate:start')

      const history = await getHistory(database, baseVersion, recordStartId)
      const currentVersion = getCurrentVersion(history)
      const migrations = await getMigrationsToRun(
        source,
        baseVersion,
        currentVersion,
        targetVersion
      )

      for (const migration of migrations) {
        emit('migrate:run:start', migration)

        await database.run(migration)

        emit('migrate:run:end', migration)
      }
    } finally {
      emit('migrate:end')

      await unlock()
    }
  }

  const repair: SynorMigrator['repair'] = async () => {
    const { baseVersion, recordStartId } = config

    try {
      await lock()

      emit('repair:start')

      const history = await getHistory(database, baseVersion, recordStartId)
      const records = await getRecordsToRepair(source, baseVersion, history)
      await database.repair(records)
    } finally {
      emit('repair:end')

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
    repair,
    on
  }
}
