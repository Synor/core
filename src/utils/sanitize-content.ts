export function sanitizeContent(content: string): string {
  return content.replace(/[\r\n]+/gm, '\n').trim()
}
