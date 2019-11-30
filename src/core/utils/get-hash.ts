import crypto from 'crypto'

export function getHash(content: string): string {
  const sanitizedContent = content.replace(/[\r\n]+/gm, '\n').trim()
  return crypto
    .createHash('sha256')
    .update(sanitizedContent, 'utf8')
    .digest('hex')
}
