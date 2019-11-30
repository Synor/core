type SynorConfig = import('..').SynorConfig
type SynorMigrationType = import('../core/migration').SynorMigrationType
type SynorMigrationVersion = import('../core/migration').SynorMigrationVersion

export type MigrationInfo = {
  version: SynorMigrationVersion
  type: SynorMigrationType
  title: string
  extension: string
  raw: string
}

export type MigrationInfoParser = (migration: string) => MigrationInfo

function getMigrationInfoRegex({
  do: DO,
  undo: UNDO,
  seperator: SEPERATOR,
  extension: EXTENSION
}: SynorConfig['migrationInfoNotation']): RegExp {
  const version = `[0-9]+(?:\\.[0-9]+)*`
  const type = [DO, UNDO].join('|')
  const extension = Array.isArray(EXTENSION) ? EXTENSION.join('|') : EXTENSION
  const title = '.+'

  return new RegExp(
    `^(${version}).(${type})${SEPERATOR}(${title})(?:\\.(${extension}))$`,
    'i'
  )
}

export const getMigrationInfoParser = (
  config: SynorConfig
): MigrationInfoParser => {
  const migrationInfoRegex = getMigrationInfoRegex(config.migrationInfoNotation)

  const typeMap: Record<string, SynorMigrationType> = {
    [config.migrationInfoNotation.do]: 'DO',
    [config.migrationInfoNotation.undo]: 'UNDO'
  }

  return migration => {
    const infoMatches = migration.match(migrationInfoRegex)

    if (infoMatches === null) {
      throw new Error('PARSE_ERROR')
    }

    const [raw, version, type, title, extension] = infoMatches

    return {
      version,
      type: typeMap[type],
      title,
      extension: extension.toLowerCase(),
      raw
    }
  }
}
