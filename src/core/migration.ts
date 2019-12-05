import { getHash } from 'core/utils/get-hash'

type SynorConfig = import('../index').SynorConfig

export type MigrationType = 'DO' | 'UNDO'
export type MigrationVersion = string

export type MigrationInfo = {
  version: MigrationVersion
  type: MigrationType
  title: string
  raw: string
}

export type MigrationInfoParser = (migration: string) => MigrationInfo

export type MigrationSource = {
  version: MigrationVersion
  type: MigrationType
  title: string
  hash: string
  body: string
}

export type MigrationRecord = {
  id: number
  version: MigrationVersion
  type: MigrationType
  title: string
  hash: string
  appliedAt: Date
  appliedBy: string
  executionTime: number
}

export type MigrationRecordState = 'applied' | 'reverted'

export type ExtendedMigrationRecord = MigrationRecord & {
  state: MigrationRecordState
  revertedBy: number | null
}

function getMigrationInfoRegex({
  do: DO,
  undo: UNDO,
  seperator: SEPERATOR
}: SynorConfig['migrationInfoNotation']): RegExp {
  const version = `[0-9]+`
  const type = [DO, UNDO].join('|')
  const title = '.+'

  return new RegExp(
    `^(${version}).(${type})${SEPERATOR}(${title})(?:\\.(.+))?$`,
    'i'
  )
}

export const getMigrationInfoParser = (
  config: SynorConfig
): MigrationInfoParser => {
  const migrationInfoRegex = getMigrationInfoRegex(config.migrationInfoNotation)

  const typeMap: Record<string, MigrationType> = {
    [config.migrationInfoNotation.do.toUpperCase()]: 'DO',
    [config.migrationInfoNotation.undo.toUpperCase()]: 'UNDO'
  }

  return migration => {
    const infoMatches = migration.match(migrationInfoRegex)

    if (infoMatches === null) {
      throw new Error('PARSE_ERROR')
    }

    const [raw, version, type, title] = infoMatches

    return {
      version,
      type: typeMap[type.toUpperCase()],
      title,
      raw
    }
  }
}

export function SynorMigration(
  { version, type, title }: MigrationInfo,
  content: Buffer
): MigrationSource {
  const migration: MigrationSource = {
    version,
    type,
    title,
    get hash() {
      return getHash(this.body)
    },
    get body() {
      return content.toString('utf8')
    }
  }

  return migration
}
