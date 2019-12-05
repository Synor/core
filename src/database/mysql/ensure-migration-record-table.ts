import { performance } from 'perf_hooks'

type MigrationVersion = import('../../core/migration').MigrationVersion
type QueryStore = import('./queries').QueryStore

export const ensureMigrationRecordTable = async (
  queryStore: QueryStore,
  baseVersion: MigrationVersion
): Promise<void> => {
  const existingColumnNames = await queryStore.getMigrationTableColumnNames()

  const migrationTableExists = Boolean(existingColumnNames.length)

  const startTime = performance.now()

  if (!migrationTableExists) {
    await queryStore.createMigrationTable()
  }

  for (const [columnName, addColumn] of Object.entries(queryStore.addColumn)) {
    if (!existingColumnNames.includes(columnName)) {
      await addColumn()
    }
  }

  const endTime = performance.now()

  if (!migrationTableExists) {
    await queryStore.addRecord({
      version: baseVersion,
      type: 'DO',
      title: 'Base Migration',
      hash: '',
      appliedAt: new Date(),
      appliedBy: 'Synor',
      executionTime: endTime - startTime
    })
  }
}
