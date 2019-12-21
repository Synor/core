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
