import { sortVersions } from 'utils/sort-versions'

type MigrationRecord = import('../migration').MigrationRecord

type Version = MigrationRecord['version']

export function getCurrentVersion(history: MigrationRecord[]): string {
  const appliedVersionMap = history.reduce<Record<Version, true>>(
    (applied, { version, type }): Record<Version, true> => {
      if (type === 'DO') {
        applied[version] = true
      }

      if (type === 'UNDO') {
        delete applied[version]
      }

      return applied
    },
    {}
  )

  const appliedVersions = sortVersions(Object.keys(appliedVersionMap))

  const currentVersion = appliedVersions[appliedVersions.length - 1]

  return currentVersion
}
