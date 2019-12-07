import { EventEmitter } from 'events'

type MigrationSource = import('./migration').MigrationSource
type MigrationVersion = import('./migration').MigrationVersion
type MigrationHistory = import('./migration').MigrationHistory

type SynorMigratorEvent =
  | 'lock:start'
  | 'lock:end'
  | 'unlock:start'
  | 'unlock:end'
  | 'open:start'
  | 'open:end'
  | 'close:start'
  | 'close:end'
  | 'drop:start'
  | 'drop:end'
  | 'version:start'
  | 'version'
  | 'version:end'
  | 'history:start'
  | 'history'
  | 'history:end'
  | 'pending:start'
  | 'pending'
  | 'pending:end'
  | 'validate:start'
  | 'validate:end'
  | 'migrate:start'
  | 'migrate:run:start'
  | 'migrate:run:end'
  | 'migrate:end'
  | 'repair:start'
  | 'repair:end'

type EventWithData =
  | 'version'
  | 'history'
  | 'pending'
  | 'migrate:run:start'
  | 'migrate:run:end'

type EmitEvent<Event extends SynorMigratorEvent, Data = void> = (
  event: Event,
  data: Data
) => void

type SynorEventEmitterEmit = EmitEvent<'version', MigrationVersion> &
  EmitEvent<'history', MigrationHistory> &
  EmitEvent<'pending', MigrationSource[]> &
  EmitEvent<'migrate:run:start' | 'migrate:run:end', MigrationSource> &
  EmitEvent<Exclude<SynorMigratorEvent, EventWithData>>

type OnEvent<Event extends SynorMigratorEvent, Data = void> = (
  event: Event,
  listener: (data: Data) => void
) => void

type SynorEventEmitterOn = OnEvent<'version', MigrationVersion> &
  OnEvent<'history', MigrationHistory> &
  OnEvent<'pending', MigrationSource[]> &
  OnEvent<'migrate:run:start' | 'migrate:run:end', MigrationSource> &
  OnEvent<Exclude<SynorMigratorEvent, EventWithData>>

type SynorEventEmitter = {
  emit: SynorEventEmitterEmit
  on: SynorEventEmitterOn
}

export function SynorEventEmitter(): SynorEventEmitter {
  const eventEmitter = new EventEmitter()

  const emit: EmitEvent<SynorMigratorEvent, any> = (event, data) => {
    eventEmitter.emit(event, data)
  }

  const on: OnEvent<SynorMigratorEvent, any> = (event, listener) => {
    eventEmitter.on(event, listener)
  }

  return {
    emit,
    on
  }
}
