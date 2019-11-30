import { sortVersions } from 'utils/sort-versions'

type SynorMigrationRecord = import('../migration').SynorMigrationRecord

type Version = SynorMigrationRecord['version']

export function getCurrentVersion(history: SynorMigrationRecord[]): string {
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
