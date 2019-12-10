type MigrationHistory = import('../migration').MigrationHistory

export function getCurrentVersion(history: MigrationHistory): string {
  const appliedMigrations = history
    .filter(({ state, type }) => state === 'applied' && type === 'do')
    .sort((a, b) => a.id - b.id)

  const currentVersion = appliedMigrations[appliedMigrations.length - 1].version

  return currentVersion
}
