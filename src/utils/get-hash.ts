import crypto from 'crypto'
import { sanitizeContent } from './sanitize-content'

/**
 * Generates HEX encoded SHA256 hash for the content (after normalizing)
 */
export function getHash(content: string): string {
  return crypto
    .createHash('sha256')
    .update(sanitizeContent(content), 'utf8')
    .digest('hex')
}
