import { APP_HOST, APP_SCHEME } from './constants'

const ENCODED_OCTET_PATTERN = /%[0-9a-f]{2}/i

function containsControlCharacter(value: string): boolean {
  return [...value].some((character) => {
    const codePoint = character.codePointAt(0)
    return codePoint !== undefined && (codePoint <= 0x1f || codePoint === 0x7f)
  })
}

export interface AppResourceUrl {
  readonly url: URL
  readonly pathSegments: readonly string[]
}

function readRawAuthorityAndPath(value: string): {
  authority: string
  path: string
} | null {
  const prefix = `${APP_SCHEME}://`
  if (!value.startsWith(prefix)) return null

  const afterScheme = value.slice(prefix.length)
  const authorityEnd = afterScheme.search(/[/?#]/)
  const authority =
    authorityEnd === -1 ? afterScheme : afterScheme.slice(0, authorityEnd)
  const suffix = authorityEnd === -1 ? '' : afterScheme.slice(authorityEnd)
  const pathEnd = suffix.search(/[?#]/)
  const path = pathEnd === -1 ? suffix : suffix.slice(0, pathEnd)

  return { authority, path: path || '/' }
}

function decodePathSegments(rawPath: string): readonly string[] | null {
  if (!rawPath.startsWith('/') || rawPath.startsWith('//')) return null

  const rawSegments = rawPath.slice(1).split('/')
  if (rawSegments.at(-1) === '') rawSegments.pop()
  if (rawSegments.some((segment) => segment.length === 0)) return null

  const decodedSegments: string[] = []
  for (const rawSegment of rawSegments) {
    let decoded: string
    try {
      decoded = decodeURIComponent(rawSegment)
    } catch {
      return null
    }

    if (
      decoded === '.' ||
      decoded === '..' ||
      decoded.includes('/') ||
      decoded.includes('\\') ||
      decoded.includes(':') ||
      containsControlCharacter(decoded) ||
      ENCODED_OCTET_PATTERN.test(decoded)
    ) {
      return null
    }
    decodedSegments.push(decoded)
  }

  return decodedSegments
}

export function parseAppResourceUrl(value: string): AppResourceUrl | null {
  const raw = readRawAuthorityAndPath(value)
  if (!raw || raw.authority !== APP_HOST) return null

  let url: URL
  try {
    url = new URL(value)
  } catch {
    return null
  }

  if (
    url.protocol !== `${APP_SCHEME}:` ||
    url.host !== APP_HOST ||
    url.hostname !== APP_HOST ||
    url.port !== '' ||
    url.username !== '' ||
    url.password !== ''
  ) {
    return null
  }

  const pathSegments = decodePathSegments(raw.path)
  return pathSegments ? { url, pathSegments } : null
}

export function isTrustedAppUrl(value: string): boolean {
  return parseAppResourceUrl(value) !== null
}
