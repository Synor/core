import { getMigration } from './get-migration'

type SynorMigration = import('../migration').SynorMigration
type SynorSourceEngine = import('../source').SynorSourceEngine

type Version = SynorMigration['version']
type Type = SynorMigration['type']

export async function getMigrationsToRun(
  source: SynorSourceEngine,
  initialVersion: Version,
  fromVersion: Version,
  toVersion: Version
): Promise<SynorMigration[]> {
  const migrations: SynorMigration[] = []

  let type: Type

  if (fromVersion < toVersion) {
    type = 'DO'
  } else if (fromVersion > toVersion) {
    type = 'UNDO'
  } else {
    return migrations
  }

  if (fromVersion !== initialVersion) {
    const fromVersionExist = await source.get(fromVersion, type)
    if (!fromVersionExist) {
      throw new Error(`NOT_FOUND: Migration(${fromVersion}.${type})`)
    }
  }

  if (toVersion !== initialVersion) {
    const toVersionExist = await source.get(toVersion, type)
    if (!toVersionExist) {
      throw new Error(`NOT_FOUND: Migration(${toVersion}.${type})`)
    }
  }

  if (type === 'DO') {
    let nextVersion =
      fromVersion === initialVersion
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
    let prevVersion = fromVersion === initialVersion ? null : fromVersion

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
