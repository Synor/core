type SynorMigrationVersion = import('../core/migration').SynorMigrationVersion

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
  versionA: SynorMigrationVersion,
  versionB: SynorMigrationVersion
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
]: SynorMigrationVersion[]): SynorMigrationVersion[] {
  const compareFn = compareVersion.bind(null, 'ASC')
  return versions.sort(compareFn)
}
