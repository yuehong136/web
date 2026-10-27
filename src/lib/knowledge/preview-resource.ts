import { STORAGE_KEYS } from '@/constants'
import { APIError } from '@/api/client-types'
import { getDocumentFileUrl } from '@/api/document-files'
import {
  categorizePreviewFailure,
  type PreviewErrorCategory,
} from './preview-error'

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
  /** 只带固定分类，界面据此显示固定文案 */
  category: PreviewErrorCategory
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
    public readonly category: PreviewErrorCategory,
    public readonly reason:
      | 'http-error'
      | 'json-error'
      | 'html-response'
      | 'empty-resource',
    public readonly status?: number,
    public readonly code?: number,
  ) {
    // 后端返回的 message/retmsg/detail 不进入错误对象
    super(`Preview resource failed: ${reason} (${category})`)
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

export const getDocumentUrl = getDocumentFileUrl

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
  redirect?: RequestRedirect,
): Promise<Response> => {
  const headers = new Headers()
  const auth = buildAuthHeader()
  if (auth) headers.set('Authorization', auth)
  return fetch(url, { signal, headers, redirect })
}

/** 只读信封里的业务码（旧格式 retcode、新格式 code），不读任何文本字段 */
const readResponseCode = async (
  response: Response,
): Promise<number | undefined> => {
  const data: unknown = await response
    .clone()
    .json()
    .catch(() => null)

  if (!data || typeof data !== 'object') return undefined

  const { retcode, code } = data as { retcode?: unknown; code?: unknown }
  const value = retcode ?? code
  return typeof value === 'number' ? value : undefined
}

const createResponseError = async (
  response: Response,
  reason: 'http-error' | 'json-error',
): Promise<PreviewResourceErrorResult> => {
  const contentType = response.headers.get('content-type') || ''
  const code = contentType.includes('application/json')
    ? await readResponseCode(response)
    : undefined

  return new PreviewResourceErrorResult(
    categorizePreviewFailure({ status: response.status, code }),
    reason,
    response.status,
    code,
  )
}

export const assertPreviewResponse = async (
  response: Response,
): Promise<void> => {
  const contentType = response.headers.get('content-type') || ''

  if (!response.ok) {
    throw await createResponseError(response, 'http-error')
  }

  if (contentType.includes('application/json')) {
    throw await createResponseError(response, 'json-error')
  }

  // 可预览的文件都不是 HTML，拿到 HTML 说明登录页顶替了文件
  if (contentType.includes('text/html')) {
    throw new PreviewResourceErrorResult(
      'session-expired',
      'html-response',
      response.status,
    )
  }
}

export const assertNonEmptyBlob = (blob: Blob): void => {
  if (blob.size > 0) return
  throw new PreviewResourceErrorResult('unsupported', 'empty-resource')
}

/**
 * 捕获到的失败落到固定分类；网络中断与其他异常都算暂时不可用。
 * 下载走 REST 文件端点，失败以 HTTP 状态表达，只按状态分类。
 */
export const getPreviewErrorCategory = (
  error: unknown,
): PreviewErrorCategory => {
  if (error instanceof PreviewResourceErrorResult) return error.category
  if (error instanceof APIError)
    return categorizePreviewFailure({ status: error.status })
  return 'unavailable'
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
  error instanceof Error && error.name === 'AbortError'
