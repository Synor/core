type MigrationRecord = import('../migration').MigrationRecord
type MigrationSource = import('../migration').MigrationSource

type Direction = 'ASC' | 'DESC'

const smallerThan: Record<Direction, -1 | 1> = {
  ASC: -1,
  DESC: 1
}

const greaterThan: Record<Direction, -1 | 1> = {
  ASC: 1,
  DESC: -1
}

function compareVersion(
  direction: Direction,
  versionA: string,
  versionB: string
): -1 | 0 | 1 {
  if (versionA < versionB) {
    return smallerThan[direction]
  }

  if (versionA > versionB) {
    return greaterThan[direction]
  }

  return 0
}

export function sortVersions(
  [...versions]: string[],
  direction: Direction = 'ASC'
): string[] {
  const compareFn = compareVersion.bind(null, direction)
  return versions.sort(compareFn)
}

function compareMigration(
  direction: Direction,
  migrationA: {
    id?: MigrationRecord['id']
    version: MigrationRecord['version']
  },
  migrationB: {
    id?: MigrationRecord['id']
    version: MigrationRecord['version']
  }
): -1 | 0 | 1 {
  const result = compareVersion(
    direction,
    migrationA.version,
    migrationB.version
  )

  if (result !== 0) {
    return result
  }

  if (migrationA.id! < migrationB.id!) {
    return smallerThan[direction]
  }

  if (migrationA.id! > migrationB.id!) {
    return greaterThan[direction]
  }

  return result
}

export function sortMigrations<T extends MigrationRecord | MigrationSource>(
  [...migrations]: T[],
  direction: Direction = 'ASC'
): T[] {
  const compareFn = compareMigration.bind(null, direction)
  return migrations.sort(compareFn)
}
