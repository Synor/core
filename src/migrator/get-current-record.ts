type MigrationHistory = import('../migration').MigrationHistory

export function getCurrentRecord(
  history: MigrationHistory
): MigrationHistory[number] {
  const appliedMigrations = history
    .filter(({ state, type }) => state === 'applied' && type === 'do')
    .sort((a, b) => a.id - b.id)

  const currentRecord = appliedMigrations[appliedMigrations.length - 1]

  return currentRecord
}
