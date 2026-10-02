/** Parse structured tool text without swallowing React rendering failures. */
export function parseToolJsonObject(
  text: string,
): Record<string, unknown> | unknown[] | undefined {
  try {
    const parsed: unknown = JSON.parse(text)
    if (parsed !== null && typeof parsed === 'object') {
      return parsed as Record<string, unknown> | unknown[]
    }
  } catch {
    // Plain text and incomplete streamed JSON remain text.
  }
  return undefined
}
