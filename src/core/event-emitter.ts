import { EventEmitter } from 'events'

type MigrationSource = import('./migration').MigrationSource
type MigrationVersion = import('./migration').MigrationVersion
type MigrationHistory = import('./migration').MigrationHistory

type SynorMigratorEvent = {
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
  'validate:end': []
  'migrate:start': []
  'migrate:run:start': [MigrationSource]
  'migrate:run:end': [MigrationSource]
  'migrate:end': []
  'repair:start': []
  'repair:end': []
}

type SynorEventEmitterEmit = <EventName extends keyof SynorMigratorEvent>(
  event: EventName,
  ...data: SynorMigratorEvent[EventName]
) => void

type SynorEventEmitterOn = <EventName extends keyof SynorMigratorEvent>(
  event: EventName,
  listener: (...data: SynorMigratorEvent[EventName]) => void
) => { on: SynorEventEmitterOn }

type SynorEventEmitter = {
  emit: SynorEventEmitterEmit
  on: SynorEventEmitterOn
}

export function SynorEventEmitter(): SynorEventEmitter {
  const eventEmitter = new EventEmitter()

  const emit: SynorEventEmitter['emit'] = (event, ...data) => {
    eventEmitter.emit(event, data)
  }

  const on: SynorEventEmitter['on'] = (event, listener) => {
    // @ts-ignore
    eventEmitter.on(event, listener)

    return { on }
  }

  return {
    emit,
    on
  }
}
