import { performance } from 'perf_hooks'

type QueryStore = import('./queries').QueryStore

export const ensureMigrationTable = async (
  queryStore: QueryStore
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
      version: '0',
      type: 'DO',
      title: 'Initialize Synor Migration',
      hash: '',
      appliedAt: new Date(),
      appliedBy: 'Synor',
      executionTime: endTime - startTime
    })
  }
}
