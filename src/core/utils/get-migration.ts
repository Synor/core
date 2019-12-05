import { SynorMigration } from '../migration'

type MigrationSource = import('../migration').MigrationSource
type MigrationType = import('../migration').MigrationType
type MigrationVersion = import('../migration').MigrationVersion
type SourceEngine = import('../source').SourceEngine

export async function getMigration(
  source: SourceEngine,
  version: MigrationVersion,
  type: MigrationType
): Promise<MigrationSource | null> {
  const info = await source.get(version, type)

  if (!info) {
    return null
  }

  const content = await source.read(info)

  const migration = SynorMigration(info, content)

  return migration
}
