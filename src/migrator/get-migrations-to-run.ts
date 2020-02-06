import { SynorError } from '../error'
import { getCurrentRecord } from './get-current-record'
import { getMigration } from './get-migration'

type MigrationRecordInfo = import('../migration').MigrationRecordInfo
type MigrationSourceInfo = import('../migration').MigrationSourceInfo
type MigrationType = import('../migration').MigrationType
type SourceEngine = import('../source').SourceEngine

export async function getMigrationsToRun({
  recordInfos,
  source,
  baseVersion,
  targetVersion: toVersion,
  outOfOrder
}: {
  recordInfos: MigrationRecordInfo[]
  source: SourceEngine
  baseVersion: string
  targetVersion: string
  outOfOrder: boolean
}): Promise<MigrationSourceInfo[]> {
  const appliedVersions = recordInfos
    .filter(({ state, type }) => state === 'applied' && type === 'do')
    .map(({ version }) => version)

  const fromVersion = getCurrentRecord(recordInfos).version

  const migrations: MigrationSourceInfo[] = []

  let type: MigrationType

  if (fromVersion < baseVersion) {
    throw new SynorError(
      `fromVersion(${fromVersion}) is below baseVersion(${baseVersion})`
    )
  }

  if (toVersion < baseVersion) {
    throw new SynorError(
      `toVersion(${toVersion}) is below baseVersion(${baseVersion})`
    )
  }

  if (fromVersion < toVersion) {
    type = 'do'
  } else if (fromVersion > toVersion) {
    type = 'undo'
  } else if (outOfOrder) {
    type = 'do'
  } else {
    return migrations
  }

  if (fromVersion !== baseVersion) {
    const fromVersionExist = await source.get(fromVersion, type)
    if (!fromVersionExist) {
      throw new SynorError(
        `Missing Migration Source => Version(${fromVersion}) Type(${type})`,
        'not_found',
        { version: fromVersion, type }
      )
    }
  }

  if (toVersion !== baseVersion) {
    const toVersionExist = await source.get(toVersion, type)
    if (!toVersionExist) {
      throw new SynorError(
        `Missing Migration Source => Version(${toVersion}) Type(${type})`,
        'not_found',
        { version: toVersion, type }
      )
    }
  }

  if (type === 'do') {
    const startVersion = outOfOrder ? baseVersion : fromVersion

    let nextVersion = await source.next(startVersion)

    if (!nextVersion && startVersion === baseVersion) {
      nextVersion = await source.first()
    }

    while (nextVersion) {
      const migration = await getMigration(source, nextVersion, type)

      if (!migration) {
        nextVersion = null
        break
      }

      if (!appliedVersions.includes(migration.version)) {
        migrations.push({ ...migration, state: 'pending' })
      }

      if (migration.version === toVersion) {
        nextVersion = null
        break
      }

      nextVersion = await source.next(migration.version)
    }
  }

  if (type === 'undo') {
    let currVersion = fromVersion === baseVersion ? null : fromVersion

    while (currVersion) {
      const migration = await getMigration(source, currVersion, type)

      if (!migration) {
        currVersion = null
        break
      }

      if (migration.version === toVersion) {
        currVersion = null
        break
      }

      if (appliedVersions.includes(migration.version)) {
        migrations.push({ ...migration, state: 'pending' })
      }

      currVersion = await source.prev(migration.version)
    }
  }

  return migrations
}
