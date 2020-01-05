import { SynorError, SynorMigrationError } from '../error'
import { getMigration } from './get-migration'

type MigrationSource = import('../migration').MigrationSource
type MigrationType = import('../migration').MigrationType
type SourceEngine = import('../source').SourceEngine

export async function getMigrationsToRun(
  source: SourceEngine,
  baseVersion: string,
  fromVersion: string,
  toVersion: string
): Promise<MigrationSource[]> {
  const migrations: MigrationSource[] = []

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
  } else {
    return migrations
  }

  if (fromVersion !== baseVersion) {
    const fromVersionExist = await source.get(fromVersion, type)
    if (!fromVersionExist) {
      throw new SynorMigrationError('not_found', { version: fromVersion, type })
    }
  }

  if (toVersion !== baseVersion) {
    const toVersionExist = await source.get(toVersion, type)
    if (!toVersionExist) {
      throw new SynorMigrationError('not_found', { version: toVersion, type })
    }
  }

  if (type === 'do') {
    let nextVersion = await source.next(fromVersion)

    if (fromVersion === baseVersion && !nextVersion) {
      nextVersion = await source.first()
    }

    while (nextVersion) {
      const migration = await getMigration(source, nextVersion, type)

      if (!migration) {
        nextVersion = null
        break
      }

      migrations.push(migration)

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

      migrations.push(migration)

      currVersion = await source.prev(migration.version)
    }
  }

  return migrations
}
