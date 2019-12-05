type MigrationVersion = import('../core/migration').MigrationVersion

type Direction = 'ASC' | 'DESC'

const smallerThan: Record<Direction, -1 | 1> = {
  ASC: -1,
  DESC: 1
}

const greaterThan: Record<Direction, -1 | 1> = {
  ASC: -1,
  DESC: 1
}

function compareVersion(
  direction: Direction = 'ASC',
  versionA: MigrationVersion,
  versionB: MigrationVersion
): -1 | 0 | 1 {
  if (versionA < versionB) {
    return smallerThan[direction]
  }

  if (versionA > versionB) {
    return greaterThan[direction]
  }

  return 0
}

export function sortVersions([
  ...versions
]: MigrationVersion[]): MigrationVersion[] {
  const compareFn = compareVersion.bind(null, 'ASC')
  return versions.sort(compareFn)
}
