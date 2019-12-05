import { createConnection } from 'mysql'
import { performance } from 'perf_hooks'
import { DatabaseEngine } from '../../core/database'
import { ensureMigrationRecordTable } from './ensure-migration-record-table'
import { getQueryStore, runQuery } from './queries'

type ConnectionConfig = import('mysql').ConnectionConfig
type DatabaseEngineFactory = import('../../core/database').DatabaseEngineFactory
type MigrationSource = import('../../core/migration').MigrationSource

type MySQLDatabaseConfig = Pick<ConnectionConfig, 'ssl'> &
  Required<
    Pick<
      ConnectionConfig,
      'database' | 'host' | 'port' | 'user' | 'password' | 'multipleStatements'
    >
  >

type MySQLDatabaseEngineConfig = {
  migrationTableName: string
}

export interface MySQLDatabaseEngine extends DatabaseEngine {
  migrationTableName: string
}

function getMySQLConfig(uri: string): MySQLDatabaseConfig {
  const {
    pathname,
    hostname,
    port,
    username,
    password,
    searchParams
  } = new URL(uri)

  let ssl: ConnectionConfig['ssl']

  if (searchParams.has('ssl')) {
    const sslRaw = searchParams.get('ssl')

    try {
      ssl = JSON.parse(sslRaw!)
    } catch {
      ssl = sslRaw!
    }
  }

  return {
    database: pathname.replace(/^\//, ''),
    host: hostname,
    port: Number(port),
    user: username,
    password: password,
    multipleStatements: true,
    ssl
  }
}

function getEngineConfig(uri: string): MySQLDatabaseEngineConfig {
  const { searchParams: params } = new URL(uri)

  const migrationTableName =
    params.get('synor-migration-record-table') || 'synor_migration_record'

  return {
    migrationTableName
  }
}

export const MySQLDatabaseEngine: DatabaseEngineFactory = (
  uri,
  { baseVersion, getAdvisoryLockId }
): MySQLDatabaseEngine => {
  const engineConfig = getEngineConfig(uri)
  const mysqlConfig = getMySQLConfig(uri)

  const advisoryLockId = getAdvisoryLockId(
    mysqlConfig.database,
    engineConfig.migrationTableName
  ).join(':')

  const connection = createConnection(mysqlConfig)

  const queryStore = getQueryStore(connection, {
    migrationTableName: engineConfig.migrationTableName,
    databaseName: mysqlConfig.database,
    advisoryLockId
  })

  const open: MySQLDatabaseEngine['open'] = async () => {
    await queryStore.openConnection()
    await ensureMigrationRecordTable(queryStore, baseVersion)
  }

  const close: MySQLDatabaseEngine['close'] = async () => {
    await queryStore.closeConnection()
  }

  const lock: MySQLDatabaseEngine['lock'] = async () => {
    const lockResult = await queryStore.getLock()
    if ([0, null].includes(lockResult)) {
      throw new Error(`Failed: GET_LOCK(${advisoryLockId})!`)
    }
  }

  const unlock: MySQLDatabaseEngine['unlock'] = async () => {
    const lockResult = await queryStore.releaseLock()
    if ([0, null].includes(lockResult)) {
      throw new Error(`Failed: RELEASE_LOCK(${advisoryLockId})!`)
    }
  }

  const drop: MySQLDatabaseEngine['drop'] = async () => {
    const tableNames = await queryStore.getTableNames()
    await queryStore.dropTables(tableNames)
  }

  const history: MySQLDatabaseEngine['history'] = async startId => {
    const history = await queryStore.getHistory(startId)
    return history
  }

  const run: MySQLDatabaseEngine['run'] = async ({
    version,
    type,
    title,
    hash,
    body
  }: MigrationSource) => {
    let dirty = false

    const startTime = performance.now()

    try {
      await runQuery(connection, body)
    } catch (err) {
      dirty = true

      throw err
    } finally {
      const endTime = performance.now()

      await queryStore.addRecord({
        version,
        type,
        title,
        hash,
        appliedAt: new Date(),
        appliedBy: '',
        executionTime: endTime - startTime,
        dirty
      })
    }
  }

  return {
    migrationTableName: engineConfig.migrationTableName,

    open,
    close,
    lock,
    unlock,
    drop,
    history,
    run
  }
}
