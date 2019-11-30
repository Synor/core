import { SynorSourceEngine } from 'core/source'
import { readdir as fsReadDir, readFile as fsReadFile } from 'fs'
import { join as joinPath } from 'path'
import { promisify } from 'util'
import { sortVersions } from 'utils/sort-versions'

type MigrationInfo = import('../../core/migration-info').MigrationInfo
type SourceEngineFactory = import('../../core/source').SourceEngineFactory

type Type = MigrationInfo['type']
type Version = MigrationInfo['version']

const readFile = promisify(fsReadFile)
const readDir = promisify(fsReadDir)

export interface FileSourceEngine extends SynorSourceEngine {
  path: string
}

export const FileSourceEngine: SourceEngineFactory = (
  uri,
  { migrationInfoParser }
): FileSourceEngine => {
  const { pathname: sourcePath } = new URL(uri)

  const migrationsByVersion: Record<
    Version,
    Record<Type, MigrationInfo | undefined>
  > = {}

  const sortedVersions: Version[] = []

  const open: FileSourceEngine['open'] = async () => {
    const entries = await readDir(sourcePath, {
      withFileTypes: true
    }).then(entries => entries.filter(entry => entry.isFile()))

    for (const entry of entries) {
      const migrationInfo = migrationInfoParser(entry.name)

      migrationsByVersion[migrationInfo.version] = {
        ...migrationsByVersion[migrationInfo.version],
        [migrationInfo.type]: migrationInfo
      }
    }

    const versions = sortVersions(Object.keys(migrationsByVersion))

    sortedVersions.push(...versions)
  }

  const close: FileSourceEngine['close'] = async () => {}

  const first: FileSourceEngine['first'] = async () => {
    const version = sortedVersions[0]
    return version || null
  }

  const prev: FileSourceEngine['prev'] = async version => {
    const index = sortedVersions.indexOf(version)
    const exists = index !== -1
    const first = index === 0

    if (first || !exists) {
      return null
    }

    const prevVersion = sortedVersions[index - 1]

    return prevVersion
  }

  const next: FileSourceEngine['next'] = async version => {
    const index = sortedVersions.indexOf(version)
    const exists = index !== -1
    const last = index === sortedVersions.length - 1

    if (last || !exists) {
      return null
    }

    const nextVersion = sortedVersions[index + 1]

    return nextVersion
  }

  const last: FileSourceEngine['last'] = async () => {
    const version = sortedVersions[sortedVersions.length - 1]
    return version || null
  }

  const read: FileSourceEngine['read'] = async ({ raw }) => {
    const migrationFilePath = joinPath(sourcePath, raw)
    return readFile(migrationFilePath)
  }

  const get: FileSourceEngine['get'] = async (version, type) => {
    const migrations = migrationsByVersion[version]

    if (!migrations) {
      return null
    }

    const migrationInfo = migrations[type]

    if (migrationInfo) {
      return migrationInfo
    }

    return null
  }

  return {
    path: sourcePath,

    open,
    close,
    first,
    prev,
    next,
    last,
    get,
    read
  }
}
