/**
 * JavaScript CRC32 - Stack Overflow - Alex
 * https://stackoverflow.com/a/18639999/4456924
 */

function generateCRC32Table(): number[] {
  const crcTable = []

  let c

  for (let n = 0; n < 256; n++) {
    c = n
    for (var k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    crcTable[n] = c
  }

  return crcTable
}

const crcTable = generateCRC32Table()

/**
 * Generates 32bit signed integer
 */
export function crc32(str: string): number {
  let crc = 0 ^ -1

  for (let i = 0; i < str.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xff]
  }

  return (crc ^ -1) >> 0
}
