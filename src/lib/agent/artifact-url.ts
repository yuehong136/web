import { API_BASE_URL } from '@/constants'

const ARTIFACT_PATH_PREFIXES = [
  '/v1/document/artifact/',
  '/api/v1/documents/artifact/',
] as const

const parseArtifactUrl = (url?: string): URL | null => {
  if (!url || url !== url.trim() || url.startsWith('//')) return null

  try {
    const apiOrigin = new URL(API_BASE_URL).origin
    const parsed = url.startsWith('/') ? new URL(url, apiOrigin) : new URL(url)
    if (
      !['http:', 'https:'].includes(parsed.protocol) ||
      parsed.origin !== apiOrigin ||
      parsed.username ||
      parsed.password
    ) {
      return null
    }

    const prefix = ARTIFACT_PATH_PREFIXES.find((path) =>
      parsed.pathname.startsWith(path),
    )
    if (!prefix) return null

    const filename = parsed.pathname.slice(prefix.length)
    const decodedFilename = decodeURIComponent(filename)
    if (
      !filename ||
      filename.includes('/') ||
      decodedFilename.includes('/') ||
      decodedFilename.includes('\\') ||
      [...decodedFilename].some((character) => {
        const code = character.charCodeAt(0)
        return code < 32 || code === 127
      })
    ) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export const isArtifactUrl = (url?: string): boolean =>
  parseArtifactUrl(url) !== null

export const resolveArtifactUrl = (url: string): string => {
  const parsed = parseArtifactUrl(url)
  if (!parsed) throw new TypeError('Invalid artifact URL')
  return parsed.toString()
}
