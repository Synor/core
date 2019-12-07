import { SynorError } from 'core/error'
import { getHash } from 'core/utils/get-hash'

type SynorConfig = import('../index').SynorConfig

export type MigrationType = 'DO' | 'UNDO'
export type MigrationVersion = string

export type MigrationInfo = {
  version: MigrationVersion
  type: MigrationType
  title: string
  filename: string
}

export type MigrationInfoParser = (migrationFilename: string) => MigrationInfo

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
  dirty: boolean
}

export type MigrationRecordState = 'applied' | 'reverted'

export type MigrationHistory = Array<
  MigrationRecord & {
    state: MigrationRecordState
    revertedBy: number | null
  }
>

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

export const getMigrationInfoParser = ({
  migrationInfoNotation
}: SynorConfig): MigrationInfoParser => {
  const migrationInfoRegex = getMigrationInfoRegex(migrationInfoNotation)

  const typeMap: Record<string, MigrationType> = {
    [migrationInfoNotation.do.toUpperCase()]: 'DO',
    [migrationInfoNotation.undo.toUpperCase()]: 'UNDO'
  }

  return migrationFilename => {
    const infoMatches = migrationFilename.match(migrationInfoRegex)

    if (infoMatches === null) {
      throw new SynorError(`Invalid Filename: ${migrationFilename}`)
    }

    const [filename, version, type, title] = infoMatches

    return {
      version,
      type: typeMap[type.toUpperCase()],
      title,
      filename
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
