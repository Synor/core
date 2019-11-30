import { promisify } from 'util'

type Connection = import('mysql').Connection
type SynorMigrationRecord = import('../../core/migration').SynorMigrationRecord

type ColumnName =
  | 'version'
  | 'type'
  | 'title'
  | 'hash'
  | 'applied_at'
  | 'applied_by'
  | 'execution_time'

type LockResult = 0 | 1 | null

export type QueryStore = {
  openConnection: () => Promise<void>
  closeConnection: () => Promise<void>

  getMigrationTableColumnNames: () => Promise<string[]>
  createMigrationTable: () => Promise<void>
  addColumn: Record<ColumnName, () => Promise<void>>

  getLock: () => Promise<LockResult>
  releaseLock: () => Promise<LockResult>

  getTableNames: () => Promise<string[]>
  dropTables: (tableNames: string[]) => Promise<void>

  getHistory: (startId?: number) => Promise<SynorMigrationRecord[]>

  addRecord: (record: Omit<SynorMigrationRecord, 'id'>) => Promise<void>
}

type QueryStoreOptions = {
  migrationTableName: string
  databaseName: string
  advisoryLockId: string
}

export async function runQuery<T = any>(
  connection: Connection,
  query: string,
  values: Array<number | string | Date> = []
): Promise<T> {
  return new Promise((resolve, reject) => {
    connection.query(query, values, (err, results) => {
      if (err) {
        reject(err)
        return
      }

      resolve(results)
    })
  })
}

export function getQueryStore(
  connection: Connection,
  {
    migrationTableName: tableName,
    databaseName,
    advisoryLockId
  }: QueryStoreOptions
): QueryStore {
  const openConnection = promisify<void>(callback =>
    connection.connect(callback)
  )

  const closeConnection = promisify<void>(callback => connection.end(callback))

  const QueryRunner = <RawResult = any, Result = RawResult>(
    query: string,
    values: Array<number | string | Date>,
    formatter: (result: RawResult) => Result = v => (v as unknown) as Result
  ) => (): Promise<Result> => {
    return runQuery<RawResult>(
      connection,
      query.replace(/\s+/, ' ').trim(),
      values
    ).then(formatter)
  }

  const getMigrationTableColumnNames = QueryRunner<
    Array<{ column_name: string }>,
    string[]
  >(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = ? AND table_schema = ?;
    `,
    [tableName, databaseName],
    rows => rows.map(({ column_name }) => column_name)
  )

  const createMigrationTable = QueryRunner(
    `
      CREATE TABLE ?? (
        ?? INT NOT NULL AUTO_INCREMENT,
        CONSTRAINT ?? PRIMARY KEY (??)
      );
    `,
    [tableName, 'id', `${tableName}_pk`, 'id']
  )

  const addColumn = {
    version: QueryRunner(
      `
        ALTER TABLE ??
          ADD COLUMN ?? VARCHAR(128) NOT NULL;
      `,
      [tableName, 'version']
    ),
    type: QueryRunner(
      `
        ALTER TABLE ??
          ADD COLUMN ?? VARCHAR(16);
      `,
      [tableName, 'type']
    ),
    title: QueryRunner(
      `
        ALTER TABLE ??
          ADD COLUMN ?? TEXT;
      `,
      [tableName, 'title']
    ),
    hash: QueryRunner(
      `
        ALTER TABLE ??
          ADD COLUMN ?? TEXT;
      `,
      [tableName, 'hash']
    ),

    applied_at: QueryRunner(
      `
        ALTER TABLE ??
          ADD COLUMN ?? TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      `,
      [tableName, 'applied_at']
    ),
    applied_by: QueryRunner(
      `
        ALTER TABLE ??
          ADD COLUMN ?? VARCHAR(255);
      `,
      [tableName, 'applied_by']
    ),
    execution_time: QueryRunner(
      `
        ALTER TABLE ??
          ADD COLUMN ?? INT;
      `,
      [tableName, 'execution_time']
    )
  }

  const getLock = QueryRunner<[{ synor_lock: LockResult }], LockResult>(
    `
      SELECT GET_LOCK(?, -1) AS synor_lock;
    `,
    [advisoryLockId],
    ([{ synor_lock }]) => synor_lock
  )

  const releaseLock = QueryRunner<[{ synor_lock: LockResult }], LockResult>(
    `
      SELECT RELEASE_LOCK(?) AS synor_lock;
    `,
    [advisoryLockId],
    ([{ synor_lock }]) => synor_lock
  )

  const getTableNames = QueryRunner<Array<{ table_name: string }>, string[]>(
    `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = ?
    `,
    [databaseName],
    rows => rows.map(({ table_name }) => table_name)
  )

  const dropTables: QueryStore['dropTables'] = tableNames => {
    return QueryRunner(
      [
        `SET FOREIGN_KEY_CHECKS = 0;`,
        ...tableNames.map(() => `DROP TABLE IF EXISTS ??;`),
        `SET FOREIGN_KEY_CHECKS = 1;`
      ].join('\n'),
      [...tableNames]
    )()
  }

  const getHistory: QueryStore['getHistory'] = (startId = 0) => {
    return QueryRunner<SynorMigrationRecord[]>(
      `
        SELECT ??, ??, ??, ??, ??, ?? AS ?, ?? AS ?, ?? AS ?
        FROM ??
        WHERE ?? >= ?;
      `,
      [
        'id',
        'version',
        'type',
        'title',
        'hash',
        'applied_at',
        'appliedAt',
        'applied_by',
        'appliedBy',
        'execution_time',
        'executionTime',
        tableName,
        'id',
        startId
      ]
    )()
  }

  const addRecord: QueryStore['addRecord'] = ({
    version,
    type,
    title,
    hash,
    appliedAt,
    appliedBy,
    executionTime
  }) => {
    return QueryRunner(
      `
        INSERT INTO ?? (
          ??, ??, ??, ??, ??, ??, ??
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?
        )
      `,
      [
        tableName,
        'version',
        'type',
        'title',
        'hash',
        'applied_at',
        'applied_by',
        'execution_time',
        version,
        type,
        title,
        hash,
        appliedAt,
        appliedBy,
        executionTime
      ]
    )()
  }

  return {
    openConnection,
    closeConnection,

    getMigrationTableColumnNames,
    createMigrationTable,
    addColumn,

    getLock,
    releaseLock,

    getTableNames,
    dropTables,

    getHistory,

    addRecord
  }
}
