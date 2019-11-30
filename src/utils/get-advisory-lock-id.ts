import { crc32 } from './crc32'

export type GetAdvisoryLockId = (
  databaseName: string,
  ...additionalNames: string[]
) => [string, string]

const synorChecksum = crc32('SYNOR')

export const getAdvisoryLockId: GetAdvisoryLockId = (
  databaseName,
  ...additionalNames
) => {
  const identifier = [databaseName].concat(additionalNames).join('\u0000')

  const checksum = crc32(identifier)

  return [String(synorChecksum), String(checksum)]
}
