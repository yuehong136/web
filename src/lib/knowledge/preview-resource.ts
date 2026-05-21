import { API_BASE_URL, API_VERSION, STORAGE_KEYS } from '@/constants'

export type FileType =
  | 'pdf'
  | 'image'
  | 'video'
  | 'docx'
  | 'xlsx'
  | 'pptx'
  | 'txt'
  | 'md'
  | 'csv'
  | 'unknown'

export type PreviewResourceAction = 'download'

export interface PreviewResourceReady {
  kind: 'ready'
  fileType: Exclude<FileType, 'unknown'>
  sourceUrl: string
  blob: Blob
  objectUrl?: string
  text?: string
  arrayBuffer?: ArrayBuffer
}

export interface PreviewResourceLoading {
  kind: 'loading'
  fileType: FileType
  sourceUrl: string
}

export interface PreviewResourceIdle {
  kind: 'idle'
  fileType: 'unknown'
  sourceUrl?: string
}

export interface PreviewResourceUnsupported {
  kind: 'unsupported'
  fileType: FileType
  sourceUrl: string
  message?: string
}

export interface PreviewResourceError {
  kind: 'error'
  fileType: FileType
  sourceUrl?: string
  error: string
}

export type PreviewResource =
  | PreviewResourceReady
  | PreviewResourceLoading
  | PreviewResourceIdle
  | PreviewResourceUnsupported
  | PreviewResourceError

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg', 'mov', 'avi']

export class PreviewResourceErrorResult extends Error {
  constructor(
    message: string,
    public readonly reason:
      | 'http-error'
      | 'json-error'
      | 'html-response'
      | 'empty-resource',
    public readonly status?: number,
  ) {
    super(message)
    this.name = 'PreviewResourceErrorResult'
  }
}

export const getFileType = (filename?: string, docType?: string): FileType => {
  const ext =
    filename?.split('.').pop()?.toLowerCase() || docType?.toLowerCase()

  if (!ext) return 'unknown'

  if (ext === 'pdf') return 'pdf'
  if (IMAGE_EXTENSIONS.includes(ext)) return 'image'
  if (VIDEO_EXTENSIONS.includes(ext)) return 'video'
  if (['doc', 'docx'].includes(ext)) return 'docx'
  if (['xls', 'xlsx'].includes(ext)) return 'xlsx'
  if (['ppt', 'pptx'].includes(ext)) return 'pptx'
  if (['txt', 'text', 'log'].includes(ext)) return 'txt'
  if (ext === 'md' || ext === 'mdx' || ext === 'markdown') return 'md'
  if (ext === 'csv') return 'csv'

  return 'unknown'
}

export const getDocumentUrl = (
  docId: string,
  action?: PreviewResourceAction,
): string => {
  const baseUrl = `${API_BASE_URL}/${API_VERSION}/document/get/${encodeURIComponent(docId)}`
  if (!action) return baseUrl
  return `${baseUrl}?action=${encodeURIComponent(action)}`
}

export const buildAuthHeader = (): string | null => {
  try {
    if (typeof localStorage === 'undefined') return null
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    if (!token) return null
    return token.startsWith('Bearer ') ? token : `Bearer ${token}`
  } catch {
    return null
  }
}

export const fetchPreviewResource = async (
  url: string,
  signal?: AbortSignal,
): Promise<Response> => {
  const headers = new Headers()
  const auth = buildAuthHeader()
  if (auth) headers.set('Authorization', auth)
  return fetch(url, { signal, headers })
}

const readJsonErrorMessage = async (
  response: Response,
): Promise<string | null> => {
  const data = await response
    .clone()
    .json()
    .catch(() => null)

  if (!data || typeof data !== 'object') return null

  const record = data as Record<string, unknown>
  const message = record.message || record.retmsg || record.detail
  return typeof message === 'string' && message ? message : null
}

export const getPreviewResponseErrorMessage = async (
  response: Response,
): Promise<string> => {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return (
      (await readJsonErrorMessage(response)) ||
      `Preview resource request failed: ${response.status}`
    )
  }

  if (contentType.includes('text/html')) {
    return 'Preview resource returned HTML; authentication may have expired'
  }

  return `Preview resource request failed: ${response.status}`
}

export const assertPreviewResponse = async (
  response: Response,
): Promise<void> => {
  const contentType = response.headers.get('content-type') || ''

  if (!response.ok) {
    throw new PreviewResourceErrorResult(
      await getPreviewResponseErrorMessage(response),
      'http-error',
      response.status,
    )
  }

  if (contentType.includes('application/json')) {
    throw new PreviewResourceErrorResult(
      await getPreviewResponseErrorMessage(response),
      'json-error',
      response.status,
    )
  }

  if (contentType.includes('text/html')) {
    throw new PreviewResourceErrorResult(
      await getPreviewResponseErrorMessage(response),
      'html-response',
      response.status,
    )
  }
}

export const assertNonEmptyBlob = (blob: Blob): void => {
  if (blob.size > 0) return
  throw new PreviewResourceErrorResult(
    'Preview resource is empty',
    'empty-resource',
  )
}

export const readBlobAsText = (blob: Blob): Promise<string> => blob.text()

export const readBlobAsArrayBuffer = (blob: Blob): Promise<ArrayBuffer> =>
  blob.arrayBuffer()

export const createPreviewObjectUrl = (blob: Blob): string =>
  URL.createObjectURL(blob)

export const revokePreviewObjectUrl = (objectUrl?: string | null): void => {
  if (!objectUrl) return
  URL.revokeObjectURL(objectUrl)
}

export const isZipLikeBlob = async (blob: Blob): Promise<boolean> => {
  try {
    const headerSlice = blob.slice(0, 4)
    const buf = await headerSlice.arrayBuffer()
    const bytes = new Uint8Array(buf)
    return bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b
  } catch (error) {
    console.error('Failed to inspect blob header', error)
    return false
  }
}

export const isAbortError = (error: unknown): boolean =>
  error instanceof Error &&
  (error.name === 'AbortError' ||
    (error.name === 'PreviewResourceErrorResult' &&
      error.message.includes('aborted')))
