import type { IHighlight } from 'react-pdf-highlighter'
import { v4 as uuid } from 'uuid'
import { API_BASE_URL, API_VERSION, STORAGE_KEYS } from '@/constants'
import { IMAGE_EXTENSIONS, VIDEO_EXTENSIONS } from './constants'
import type { FileType, RawHighlight } from './types'

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

export const getDocumentUrl = (docId: string): string => {
  return `${API_BASE_URL}/${API_VERSION}/document/get/${docId}`
}

export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
  } catch {
    return null
  }
}

export const buildAuthHeader = (): string | null => {
  const token = getAuthToken()
  if (!token) return null
  return token.startsWith('Bearer ') ? token : `Bearer ${token}`
}

export const fetchWithAuth = async (
  url: string,
  init: RequestInit = {},
): Promise<Response> => {
  const headers = new Headers(init.headers)
  const auth = buildAuthHeader()
  if (auth && !headers.has('Authorization')) headers.set('Authorization', auth)
  return fetch(url, { ...init, headers })
}

export const isAbortError = (error: unknown): boolean => {
  return error instanceof Error && error.name === 'AbortError'
}

export const buildPdfHighlights = (
  rawHighlights: RawHighlight[] | undefined,
  pageSize: { width: number; height: number },
): IHighlight[] => {
  if (
    !rawHighlights ||
    !Array.isArray(rawHighlights) ||
    rawHighlights.length === 0
  ) {
    return []
  }

  return rawHighlights.map((highlight) => {
    const boundingRect = {
      width: pageSize.width,
      height: pageSize.height,
      x1: highlight.x1,
      x2: highlight.x2,
      y1: highlight.y1,
      y2: highlight.y2,
    }
    return {
      id: uuid(),
      comment: {
        text: '',
        emoji: '',
      },
      content: {
        text: '',
      },
      position: {
        boundingRect,
        rects: [boundingRect],
        pageNumber: highlight.page,
      },
    }
  })
}

export const formatMediaTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
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
