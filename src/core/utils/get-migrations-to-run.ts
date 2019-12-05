import { getMigration } from './get-migration'

type MigrationSource = import('../migration').MigrationSource
type SourceEngine = import('../source').SourceEngine

type Version = MigrationSource['version']
type Type = MigrationSource['type']

export async function getMigrationsToRun(
  source: SourceEngine,
  baseVersion: Version,
  fromVersion: Version,
  toVersion: Version
): Promise<MigrationSource[]> {
  const migrations: MigrationSource[] = []

  let type: Type

  if (fromVersion < toVersion) {
    type = 'DO'
  } else if (fromVersion > toVersion) {
    type = 'UNDO'
  } else {
    return migrations
  }

  if (fromVersion !== baseVersion) {
    const fromVersionExist = await source.get(fromVersion, type)
    if (!fromVersionExist) {
      throw new Error(`NOT_FOUND: Migration(${fromVersion}.${type})`)
    }
  }

  if (toVersion !== baseVersion) {
    const toVersionExist = await source.get(toVersion, type)
    if (!toVersionExist) {
      throw new Error(`NOT_FOUND: Migration(${toVersion}.${type})`)
    }
  }

  if (type === 'DO') {
    let nextVersion =
      fromVersion === baseVersion
        ? await source.first()
        : await source.next(fromVersion)

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

  if (type === 'UNDO') {
    let prevVersion = fromVersion === baseVersion ? null : fromVersion

    while (prevVersion) {
      const migration = await getMigration(source, prevVersion, type)

      if (!migration) {
        prevVersion = null
        break
      }

      if (migration.version === toVersion) {
        prevVersion = null
        break
      }

      migrations.push(migration)

      prevVersion = await source.prev(migration.version)
    }
  }

  return migrations
}
