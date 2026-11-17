/**
 * Short plain-text messages (an agent's opening line) are typed out; anything
 * with Markdown, citations, tool or think blocks renders at once.
 */
const MAX_TYPING_TEXT_LENGTH = 160

const RICH_CONTENT_PATTERNS = [
  /```/,
  /`[^`\n]+`/,
  /^#{1,6}\s/m,
  /^\s*[-*+]\s+/m,
  /^\s*\d+\.\s+/m,
  /^\s*>\s+/m,
  /\|.+\|/,
  /!\[[^\]]*]\([^)]*\)/,
  /\[[^\]]+]\([^)]*\)/,
  /<\/?[a-z][\s\S]*>/i,
  /\[ID:\d+]/,
  /<sup\b/i,
  /<think\b/i,
  /<tool/i,
  /<carousel-placeholder\b/i,
]

export function shouldTypeOut(content: string): boolean {
  const text = content.trim()

  if (!text || text.length > MAX_TYPING_TEXT_LENGTH) {
    return false
  }

  return !RICH_CONTENT_PATTERNS.some((pattern) => pattern.test(text))
}
