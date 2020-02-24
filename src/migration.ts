import { SynorError } from './error'
import { getHash } from './utils/get-hash'

type SynorConfig = import('.').SynorConfig

export type MigrationType = 'do' | 'undo'

export type MigrationInfo = {
  version: string
  type: MigrationType
  title: string
  filename: string
  extension: string
}

export type MigrationInfoParser = (migrationFilename: string) => MigrationInfo

export type MigrationSourceContent =
  | {
      /**
       * Describes the migration using some kind of [Data Definition Language](https://en.wikipedia.org/wiki/Data_definition_language)
       */
      body: string
      run?: never
    }
  | {
      body?: never
      /**
       * This should only exist if `body` is omitted.
       * The function signature depends on the `DatabaseEngine` implementation.
       */
      run: (...params: any[]) => Promise<any>
    }

/**
 * MigrationSource is where the schema migration is stored
 */
export type MigrationSource = {
  version: string
  type: MigrationType
  title: string
  hash: string
} & MigrationSourceContent

/**
 * The state of MigrationSource
 *
 * `pending` -> still not applied to the database
 */
type MigrationSourceState = 'pending'

/**
 * MigrationSource with additional meta information
 */
export type MigrationSourceInfo = MigrationSource & {
  state: MigrationSourceState
}

/**
 * MigrationRecord is a schema migration that has already run against database
 */
export type MigrationRecord = {
  id: number
  version: string
  type: MigrationType
  title: string
  hash: string
  appliedAt: Date
  appliedBy: string
  executionTime: number
  dirty: boolean
}

/**
 * The state of MigrationRecord
 *
 * `applied`  -> currently applied on the database
 *
 * `reverted` -> was in `applied` state previously and then reverted with an `undo` migration
 */
type MigrationRecordState = 'applied' | 'reverted'

/**
 * MigrationRecord with additional meta information
 */
export type MigrationRecordInfo = MigrationRecord & {
  state: MigrationRecordState
  revertedBy: number | null
}

function getMigrationInfoRegex({
  do: DO,
  undo: UNDO,
  separator: SEPARATOR,
  extension: EXTENSION
}: SynorConfig['migrationInfoNotation']): RegExp {
  const version = `[0-9]+`
  const type = [DO, UNDO].join('|')
  const title = '[\\S ]+'

  return new RegExp(
    `^(${version}).(${type})${SEPARATOR}(${title})\\.(${EXTENSION})$`
  )
}

export const getMigrationInfoParser = (
  notation: SynorConfig['migrationInfoNotation']
): MigrationInfoParser => {
  const migrationInfoRegex = getMigrationInfoRegex(notation)

  const typeMap: Record<string, MigrationType> = {
    [notation.do]: 'do',
    [notation.undo]: 'undo'
  }

  return migrationFilename => {
    const infoMatches = migrationFilename.match(migrationInfoRegex)

    if (infoMatches === null) {
      throw new SynorError(
        `Invalid Filename: ${migrationFilename}`,
        'invalid_filename',
        { filename: migrationFilename }
      )
    }

    const [filename, version, type, title, extension] = infoMatches

    return {
      version,
      type: typeMap[type],
      title,
      filename,
      extension
    }
  }
}

export function SynorMigration(
  { version, type, title }: MigrationInfo,
  sourceContent: MigrationSourceContent
): MigrationSource {
  const migration: MigrationSource = {
    version,
    type,
    title,
    ...sourceContent,
    get hash() {
      if (typeof this.body === 'undefined') {
        // Non-null assertion is required because of TypeScript quirks
        return getHash(this.run!.toString())
      }

      return getHash(this.body)
    }
  }

  return migration
}
