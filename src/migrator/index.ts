import { EventEmitter } from 'events'
import { SynorDatabase } from '../database'
import { SynorError, toSynorError } from '../error'
import { SynorSource } from '../source'
import { getCurrentRecord } from './get-current-record'
import { getMigration } from './get-migration'
import { getMigrationRecordInfos } from './get-migration-record-infos'
import { getMigrationsToRun } from './get-migrations-to-run'
import { getRecordsToRepair } from './get-records-to-repair'
import { validateMigration } from './validate-migration'
import { sortMigrations } from '../utils/sort'

type DatabaseEngine = import('../database').DatabaseEngine
type MigrationRecord = import('../migration').MigrationRecord
type MigrationRecordInfo = import('../migration').MigrationRecordInfo
type MigrationSource = import('../migration').MigrationSource
type MigrationSourceInfo = import('../migration').MigrationSourceInfo
type SourceEngine = import('../source').SourceEngine
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
  'current:start': []
  current: [MigrationRecordInfo]
  'current:end': []
  'info:start': []
  info: [Array<MigrationRecordInfo | MigrationSourceInfo>]
  'info:end': []
  'validate:start': []
  'validate:run:start': [MigrationRecord]
  'validate:error': [SynorError<'dirty' | 'hash_mismatch'>, MigrationRecord]
  'validate:run:end': [MigrationRecord]
  'validate:end': []
  'migrate:start': []
  'migrate:run:start': [MigrationSource]
  'migrate:error': [SynorError<'not_found'>, MigrationSource]
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

    this.lock = this.decorate('lock:start', this.lock, 'lock:end', true)
    this.unlock = this.decorate('unlock:start', this.unlock, 'unlock:end', true)
    this.open = this.decorate('open:start', this.open, 'open:end', true)
    this.close = this.decorate('close:start', this.close, 'close:end', true)

    this.drop = this.decorate('drop:start', this.drop, 'drop:end')
    this.current = this.decorate('current:start', this.current, 'current:end')
    this.info = this.decorate('info:start', this.info, 'info:end')
    this.validate = this.decorate(
      'validate:start',
      this.validate,
      'validate:end'
    )
    this.migrate = this.decorate('migrate:start', this.migrate, 'migrate:end')
    this.repair = this.decorate('repair:start', this.repair, 'repair:end')
  }

  /**
   * Emits error event if listener is available.
   * Otherwise throws the error.
   *
   * @typeparam N event name
   */
  private readonly emitOrThrow = <
    N extends 'error' | 'migrate:error' | 'validate:error'
  >(
    event: N,
    ...data: MigratorEventStore[N]
  ): void => {
    data[0] = toSynorError(data[0])
    const hasListener = this.emit(event, ...data)
    if (!hasListener) {
      throw data[0]
    }
  }

  /**
   * Wraps a function with start and end events.
   * It also wraps everything between `this.lock` and `this.unlock` calls
   * to run the function inside an advisory lock.
   *
   * @param startEvent name of the start event
   * @param handler function to wrap
   * @param endEvent name of the end event
   * @param withoutLock if `true`, `handler` is not called inside an advisory lock.
   *
   * @typeparam T type signature of the `handler`
   */
  private readonly decorate = <T extends (...params: any[]) => Promise<void>>(
    startEvent: keyof MigratorEventStore,
    handler: T,
    endEvent: keyof MigratorEventStore,
    withoutLock: boolean = false
  ) => async (...params: Parameters<T>) => {
    try {
      if (!withoutLock) {
        await this.lock()
      }
      this.emit(startEvent)
      await handler(...params)
      this.emit(endEvent)
    } catch (error) {
      this.emitOrThrow('error', error)
    } finally {
      if (!withoutLock) {
        await this.unlock()
      }
    }
  }

  /**
   * Gets advisory lock
   */
  private readonly lock = async (): Promise<void> => {
    if (this.locked) {
      throw new SynorError('Already Locked')
    }
    await this.database.lock()
    this.locked = true
  }

  /**
   * Releases advisory lock
   */
  private readonly unlock = async (): Promise<void> => {
    if (!this.locked) {
      throw new SynorError('Not Yet Locked')
    }
    await this.database.unlock()
    this.locked = false
  }

  /**
   * Opens connections to `DatabaseEngine` & `SourceEngine`.
   */
  open = async (): Promise<void> => {
    await Promise.all([this.database.open(), this.source.open()])
  }

  /**
   * Closes connections to `DatabaseEngine` & `SourceEngine`.
   */
  close = async (): Promise<void> => {
    if (this.locked) {
      await this.unlock()
    }
    await Promise.all([this.database.close(), this.source.close()])
  }

  /**
   * Drops everything in the database.
   * It should only be used for development purposes.
   */
  drop = async (): Promise<void> => {
    await this.database.drop()
  }

  /**
   * Retrieves record for the current migration version of the database.
   */
  current = async (): Promise<void> => {
    const { baseVersion, recordStartId } = this.config
    const recordInfos = await getMigrationRecordInfos(
      this.database,
      baseVersion,
      recordStartId
    )
    const currentRecordInfo = getCurrentRecord(recordInfos)
    this.emit('current', currentRecordInfo)
  }

  /**
   * Retrieves detailed information about schema migrations.
   */
  info = async ({ outOfOrder }: { outOfOrder: boolean }): Promise<void> => {
    const { baseVersion, recordStartId } = this.config
    const items: Array<MigrationRecordInfo | MigrationSourceInfo> = []
    const recordInfos = await getMigrationRecordInfos(
      this.database,
      baseVersion,
      recordStartId
    )
    items.push(...recordInfos)
    const currentVersion = getCurrentRecord(recordInfos).version
    const targetVersion = await this.source.last()
    if (!targetVersion || currentVersion >= targetVersion) {
      this.emit('info', sortMigrations(items))
      return
    }
    const migrations = await getMigrationsToRun({
      recordInfos,
      source: this.source,
      baseVersion,
      targetVersion,
      outOfOrder
    })
    items.push(...migrations)
    this.emit('info', sortMigrations(items))
  }

  /**
   * Validates the records for migrations that are currently applied.
   */
  validate = async (): Promise<void> => {
    const { baseVersion, recordStartId } = this.config
    const recordInfos = await getMigrationRecordInfos(
      this.database,
      baseVersion,
      recordStartId
    ).then(recordInfos =>
      recordInfos.filter(
        ({ version, state }) => version !== baseVersion && state === 'applied'
      )
    )
    for (const record of recordInfos) {
      this.emit('validate:run:start', record)
      const migration = await getMigration(
        this.source,
        record.version,
        record.type
      )
      if (!migration) {
        throw new SynorError(
          `Missing Migration Source => Version(${record.version}) Type(${record.type}) Title(${record.title})`,
          'not_found',
          record
        )
      }
      try {
        validateMigration(record, migration)
        this.emit('validate:run:end', record)
      } catch (error) {
        this.emitOrThrow('validate:error', error, record)
      }
    }
  }

  /**
   * Runs necessary migrations to reach the target migration version.
   *
   * @param targetVersion Target migration version
   */
  migrate = async (
    targetVersion: string,
    { outOfOrder }: { outOfOrder: boolean }
  ): Promise<void> => {
    const { baseVersion, recordStartId } = this.config
    const recordInfos = await getMigrationRecordInfos(
      this.database,
      baseVersion,
      recordStartId
    )
    const migrations = await getMigrationsToRun({
      recordInfos,
      source: this.source,
      baseVersion,
      targetVersion,
      outOfOrder
    })
    for (const migration of migrations) {
      this.emit('migrate:run:start', migration)
      try {
        await this.database.run(migration)
        this.emit('migrate:run:end', migration)
      } catch (error) {
        this.emitOrThrow('migrate:error', error, migration)
      }
    }
  }

  /**
   * Repairs migration records.
   * It updates the `hash` in records with the `hash` from source for mismatched hashes.
   * It also deletes the records marked as `dirty`.
   */
  repair = async (): Promise<void> => {
    const { baseVersion, recordStartId } = this.config
    const recordInfos = await getMigrationRecordInfos(
      this.database,
      baseVersion,
      recordStartId
    )
    const records = await getRecordsToRepair(
      this.source,
      baseVersion,
      recordInfos
    )
    await this.database.repair(records)
  }
}
