const NEWLINE = '\n'

export function sanitizeContent(content: string): string {
  return content
    .replace(/[\r\n]+/gm, NEWLINE)
    .trim()
    .split(NEWLINE)
    .map(line => line.trim())
    .join(NEWLINE)
}
