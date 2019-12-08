import { SynorDatabase } from 'core/database'
import { SynorError, SynorMigrationError } from 'core/error'
import { SynorSource } from 'core/source'
import { getCurrentVersion } from 'core/utils/get-current-version'
import { getHistory } from 'core/utils/get-history'
import { getMigration } from 'core/utils/get-migration'
import { getMigrationsToRun } from 'core/utils/get-migrations-to-run'
import { getRecordsToRepair } from 'core/utils/get-records-to-repair'
import { validateMigration } from 'core/utils/validate-migration'
import { EventEmitter } from 'events'

type DatabaseEngine = import('./database').DatabaseEngine
type MigrationHistory = import('./migration').MigrationHistory
type MigrationRecord = import('./migration').MigrationRecord
type MigrationSource = import('./migration').MigrationSource
type MigrationVersion = import('./migration').MigrationVersion
type SourceEngine = import('./source').SourceEngine
type SynorConfig = import('..').SynorConfig

type MigratorEventStore = {
  'lock:start': []
  'lock:end': []
  'unlock:start': []
  'unlock:end': []
  'open:start': []
  'open:end': []
  'close:start': []
  'close:end': []
  'drop:start': []
  'drop:end': []
  'version:start': []
  version: [MigrationVersion]
  'version:end': []
  'history:start': []
  history: [MigrationHistory]
  'history:end': []
  'pending:start': []
  pending: [MigrationSource[]]
  'pending:end': []
  'validate:start': []
  'validate:run:start': [MigrationRecord]
  'validate:error': [MigrationRecord, Error]
  'validate:run:end': [MigrationRecord]
  'validate:end': []
  'migrate:start': []
  'migrate:run:start': [MigrationSource]
  'migrate:error': [MigrationSource, Error]
  'migrate:run:end': [MigrationSource]
  'migrate:end': []
  'repair:start': []
  'repair:end': []
  error: [Error]
}

type EventStore = Record<string | symbol, any[]>
type Listener<S extends EventStore, N extends keyof S> = (...data: S[N]) => void
type UpdateListener<S extends EventStore, R extends any> = <N extends keyof S>(
  event: N,
  listener: Listener<S, N>
) => R

export interface SynorMigrator extends EventEmitter {
  addListener: UpdateListener<MigratorEventStore, this>
  on: UpdateListener<MigratorEventStore, this>
  once: UpdateListener<MigratorEventStore, this>
  prependListener: UpdateListener<MigratorEventStore, this>
  prependOnceListener: UpdateListener<MigratorEventStore, this>
  removeListener: UpdateListener<MigratorEventStore, this>
  off: UpdateListener<MigratorEventStore, this>
  removeAllListeners(event?: keyof MigratorEventStore): this
  listeners<N extends keyof MigratorEventStore>(
    event: N
  ): Array<Listener<MigratorEventStore, N>>
  rawListeners<N extends keyof MigratorEventStore>(
    event: N
  ): Array<Listener<MigratorEventStore, N>>
  emit<N extends keyof MigratorEventStore>(
    event: N,
    ...data: MigratorEventStore[N]
  ): boolean
  listenerCount(type: keyof MigratorEventStore): number
}

export class SynorMigrator extends EventEmitter {
  private readonly config: SynorConfig
  private readonly database: DatabaseEngine
  private readonly source: SourceEngine

  private locked: boolean

  constructor(config: SynorConfig) {
    super()

    this.setMaxListeners(1)

    this.config = config
    this.database = SynorDatabase(config)
    this.source = SynorSource(config)

    this.locked = false

    this.drop = this.decorate('drop:start', this.drop, 'drop:end')
    this.version = this.decorate('version:start', this.version, 'version:end')
    this.history = this.decorate('history:start', this.history, 'history:end')
    this.pending = this.decorate('pending:start', this.pending, 'pending:end')
    this.validate = this.decorate(
      'validate:start',
      this.validate,
      'validate:end'
    )
    this.migrate = this.decorate('migrate:start', this.migrate, 'migrate:end')
    this.repair = this.decorate('repair:start', this.repair, 'repair:end')
  }

  private readonly decorate = <T extends (...params: any[]) => Promise<void>>(
    startEvent: keyof MigratorEventStore,
    handler: T,
    endEvent: keyof MigratorEventStore
  ) => async (...params: Parameters<T>) => {
    try {
      await this.lock()
      this.emit(startEvent)
      await handler(...params)
    } catch (error) {
      this.emit('error', error)
    } finally {
      this.emit(endEvent)
      await this.unlock()
    }
  }

  private readonly lock = async (): Promise<void> => {
    this.emit('lock:start')
    if (this.locked) {
      throw new SynorError('Already Locked')
    }
    await this.database.lock()
    this.locked = true
    this.emit('lock:end')
  }

  private readonly unlock = async (): Promise<void> => {
    this.emit('unlock:start')
    if (!this.locked) {
      throw new SynorError('Not Locked')
    }
    await this.database.unlock()
    this.locked = false
    this.emit('unlock:end')
  }

  open = async (): Promise<void> => {
    this.emit('open:start')
    await Promise.all([this.database.open(), this.source.open()])
    this.emit('open:end')
  }

  close = async (): Promise<void> => {
    this.emit('close:start')
    await Promise.all([this.database.close(), this.source.close()])
    this.emit('close:end')
  }

  drop = async (): Promise<void> => {
    await this.database.drop()
  }

  version = async (): Promise<void> => {
    const { baseVersion, recordStartId } = this.config
    const history = await getHistory(this.database, baseVersion, recordStartId)
    const currentVersion = getCurrentVersion(history)
    this.emit('version', currentVersion)
  }

  history = async (
    recordStartId: number = this.config.recordStartId
  ): Promise<void> => {
    const { baseVersion } = this.config
    const history = await getHistory(this.database, baseVersion, recordStartId)
    this.emit('history', history)
  }

  pending = async (): Promise<void> => {
    const { baseVersion, recordStartId } = this.config
    const history = await getHistory(this.database, baseVersion, recordStartId)
    const currentVersion = getCurrentVersion(history)
    const targetVersion = await this.source.last()
    if (!targetVersion || currentVersion >= targetVersion) {
      this.emit('pending', [])
      return
    }
    const migrations = await getMigrationsToRun(
      this.source,
      baseVersion,
      currentVersion,
      targetVersion
    )
    this.emit('pending', migrations)
  }

  validate = async (): Promise<void> => {
    const { baseVersion, recordStartId } = this.config
    const records = await getHistory(
      this.database,
      baseVersion,
      recordStartId
    ).then(history =>
      history.filter(
        ({ version, type, state }) =>
          version !== baseVersion && type === 'DO' && state === 'applied'
      )
    )
    for (const record of records) {
      this.emit('validate:run:start', record)
      const migration = await getMigration(
        this.source,
        record.version,
        record.type
      )
      if (!migration) {
        throw new SynorMigrationError('not_found', record)
      }
      try {
        validateMigration(record, migration)
      } catch (error) {
        const hasListener = this.emit('validate:error', record, error)
        if (!hasListener) {
          throw error
        }
      }
      this.emit('validate:run:end', record)
    }
  }

  migrate = async (targetVersion: MigrationVersion): Promise<void> => {
    const { baseVersion, recordStartId } = this.config
    const history = await getHistory(this.database, baseVersion, recordStartId)
    const currentVersion = getCurrentVersion(history)
    const migrations = await getMigrationsToRun(
      this.source,
      baseVersion,
      currentVersion,
      targetVersion
    )
    for (const migration of migrations) {
      this.emit('migrate:run:start', migration)
      try {
        await this.database.run(migration)
      } catch (error) {
        const hasListener = this.emit('migrate:error', migration, error)
        if (!hasListener) {
          throw error
        }
      }
      this.emit('migrate:run:end', migration)
    }
  }

  repair = async (): Promise<void> => {
    const { baseVersion, recordStartId } = this.config
    const history = await getHistory(this.database, baseVersion, recordStartId)
    const records = await getRecordsToRepair(this.source, baseVersion, history)
    await this.database.repair(records)
  }
}
