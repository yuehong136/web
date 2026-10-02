import { APIError, apiClient } from '@/api/client'
import { knowledgeRestConfig } from '@/api/knowledge-config'
import { withBinaryAbort } from './binary-response'

export type DocumentImageSource =
  | { kind: 'dataset'; imageId: string }
  | { kind: 'canonical'; url: string }
  | { kind: 'runtime'; fileId: string }

export const documentImageKeys = {
  all: () => ['document-images'] as const,
  image: (epoch: number, url: string) =>
    [...documentImageKeys.all(), epoch, url] as const,
}

const invalidSource = () => new APIError(400, '101', 'Invalid image request.')
const invalidImage = (status = 415) =>
  new APIError(status, '102', 'Image data is invalid.')
function validCompoundId(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const separator = value.indexOf('-')
  return Boolean(
    value.length <= 1024 &&
    separator > 0 &&
    value.slice(0, separator).trim() &&
    value.slice(separator + 1).trim() &&
    [...value].every(
      (character) =>
        character.charCodeAt(0) >= 32 && character.charCodeAt(0) !== 127,
    ),
  )
}

/** Raw IDs and already encoded canonical URLs have separate trust boundaries. */
export function resolveDocumentImageUrl(
  source: DocumentImageSource,
  baseURL = knowledgeRestConfig.baseURL,
  pageOrigin = typeof window === 'undefined'
    ? undefined
    : window.location.origin,
): string {
  const base = new URL(`${baseURL.replace(/\/$/, '')}/v1/`, pageOrigin)
  if (
    !['http:', 'https:'].includes(base.protocol) ||
    base.username ||
    base.password
  )
    throw invalidSource()
  if (source.kind === 'dataset') {
    if (!validCompoundId(source.imageId)) throw invalidSource()
    return `${base.href}documents/images/${encodeURIComponent(source.imageId)}`
  }
  if (source.kind === 'runtime') {
    if (!/^[a-f0-9]{32}$/.test(source.fileId)) throw invalidSource()
    return `${base.href}documents/runtime/${source.fileId}/image`
  }
  const raw = source.url
  if (
    typeof raw !== 'string' ||
    !raw ||
    raw.startsWith('//') ||
    /[\s\\]/.test(raw) ||
    /%(?![a-f0-9]{2})/i.test(raw) ||
    (!raw.startsWith('/') && !/^https?:\/\//.test(raw))
  )
    throw invalidSource()
  let url: URL
  try {
    url = new URL(raw, base.origin)
  } catch {
    throw invalidSource()
  }
  const prefix = `${base.pathname}documents/images/`
  if (
    url.origin !== base.origin ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !url.pathname.startsWith(prefix)
  )
    throw invalidSource()
  try {
    if (!validCompoundId(decodeURIComponent(url.pathname.slice(prefix.length))))
      throw invalidSource()
  } catch {
    throw invalidSource()
  }
  return url.href
}

const rasterTypes = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/bmp',
])

function signatureMatches(type: string, b: Uint8Array): boolean {
  const ascii = (start: number, end: number) =>
    String.fromCharCode(...b.slice(start, end))
  switch (type) {
    case 'image/png':
      return [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => b[i] === v)
    case 'image/jpeg':
      return b[0] === 255 && b[1] === 216 && b[2] === 255
    case 'image/gif':
      return ['GIF87a', 'GIF89a'].includes(ascii(0, 6))
    case 'image/webp':
      return ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP'
    case 'image/bmp':
      return ascii(0, 2) === 'BM'
    default:
      return false
  }
}

/** No object URL exists until status, MIME, signature and native decoding pass. */
export async function readDocumentImage(
  source: DocumentImageSource,
  signal?: AbortSignal,
): Promise<Blob> {
  const url = resolveDocumentImageUrl(source)
  return apiClient.get<Blob>(url, {
    signal,
    redirect: 'error',
    cache: 'no-store',
    readResponse: async (response, combinedSignal) => {
      const mime = response.headers
        .get('content-type')
        ?.split(';')[0]
        .trim()
        .toLowerCase()
      if (mime === 'application/json') {
        const body: unknown = await response.json().catch(() => null)
        const code =
          body &&
          typeof body === 'object' &&
          'code' in body &&
          typeof body.code === 'number' &&
          Number.isInteger(body.code)
            ? String(body.code)
            : 'HTTP_ERROR'
        throw new APIError(
          response.status,
          code === '0' ? '102' : code,
          'Image could not be read.',
        )
      }
      if (response.status !== 200)
        throw new APIError(
          response.status,
          'HTTP_ERROR',
          'Image could not be read.',
        )
      if (!mime || !rasterTypes.has(mime)) throw invalidImage(response.status)
      const blob = await response.blob()
      combinedSignal.throwIfAborted()
      if (
        !blob.size ||
        !signatureMatches(
          mime,
          new Uint8Array(await blob.slice(0, 12).arrayBuffer()),
        )
      )
        throw invalidImage()
      try {
        const decoding = createImageBitmap(blob)
        // Native decoding can finish after cancellation; always close its result.
        void decoding.then(
          (bitmap) => bitmap.close(),
          () => {},
        )
        await withBinaryAbort(decoding, combinedSignal)
      } catch {
        combinedSignal.throwIfAborted()
        throw invalidImage()
      }
      combinedSignal.throwIfAborted()
      return blob
    },
  })
}
