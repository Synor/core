import { SynorMigration } from 'core/migration'

type SynorMigrationType = import('../migration').SynorMigrationType
type SynorMigrationVersion = import('../migration').SynorMigrationVersion
type SynorSourceEngine = import('../source').SynorSourceEngine

export async function getMigration(
  source: SynorSourceEngine,
  version: SynorMigrationVersion,
  type: SynorMigrationType
): Promise<SynorMigration | null> {
  const info = await source.get(version, type)

  if (!info) {
    return null
  }

  const content = await source.read(info)

  const migration = SynorMigration(info, content)

  return migration
}
