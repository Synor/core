import { SynorError } from '../error'
import { getCurrentRecord } from './get-current-record'
import { getMigration } from './get-migration'

type MigrationRecordInfo = import('../migration').MigrationRecordInfo
type MigrationSourceInfo = import('../migration').MigrationSourceInfo
type MigrationType = import('../migration').MigrationType
type SourceEngine = import('../source').SourceEngine

type GetMigrationsToRunParams = {
  recordInfos: MigrationRecordInfo[]
  source: SourceEngine
  baseVersion: string
  targetVersion: string
  outOfOrder: boolean
}

export async function getMigrationsToRun({
  recordInfos,
  source,
  baseVersion,
  targetVersion: toVersion,
  outOfOrder
}: GetMigrationsToRunParams): Promise<MigrationSourceInfo[]> {
  const appliedMigrationVersions = recordInfos
    .filter(({ state, type }) => state === 'applied' && type === 'do')
    .map(({ version }) => version)

  const fromVersion = getCurrentRecord(recordInfos).version

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

  const migrations: MigrationSourceInfo[] = []

  // determine the type of migrations to run
  let type: MigrationType

  if (fromVersion < toVersion) {
    type = 'do'
  } else if (fromVersion > toVersion) {
    type = 'undo'
  } else if (outOfOrder) {
    // in case of outOfOrder run, even if fromVersion === toVersion
    // previous versions can exist in `pending` state
    type = 'do'
  } else {
    // nothing to run
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
    // in case of outOfOrder run, we need to start checking from baseVersion
    const startVersion = outOfOrder ? baseVersion : fromVersion

    let nextVersion = await source.next(startVersion)

    // source for baseVersion is not required to exists
    // in that case, source engine wouldn't be able to return the next version
    if (!nextVersion && startVersion === baseVersion) {
      // so we start from the first version available at source
      nextVersion = await source.first()
    }

    while (nextVersion) {
      const migration = await getMigration(source, nextVersion, type)

      if (!migration) {
        // in case of missing migration source, we stop early
        nextVersion = null
        break
      }

      // checking if this migration is already applied on database
      // this is required because in case of outOfOrder run, we start from baseVersion
      // so we may encounter migrations that are already applied
      if (!appliedMigrationVersions.includes(migration.version)) {
        migrations.push({ ...migration, state: 'pending' })
      }

      if (migration.version === toVersion) {
        // we've reached the targetVersion
        nextVersion = null
        break
      }

      nextVersion = await source.next(migration.version)
    }
  }

  if (type === 'undo') {
    // if we are at baseVersion, there is nothing to undo
    let currVersion = fromVersion === baseVersion ? null : fromVersion

    while (currVersion) {
      const migration = await getMigration(source, currVersion, type)

      if (!migration) {
        // in case of missing migration source, we stop early
        currVersion = null
        break
      }

      if (migration.version === toVersion) {
        // we've reached the targetVersion
        currVersion = null
        break
      }

      // checking if this migration is actually applied on database
      // this is required because in case of outOfOrder run,
      // we may encounter migrations that were never applied
      if (appliedMigrationVersions.includes(migration.version)) {
        migrations.push({ ...migration, state: 'pending' })
      }

      currVersion = await source.prev(migration.version)
    }
  }

  return migrations
}
