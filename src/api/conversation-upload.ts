import { apiClient, APIError } from './client'
import { te } from './client-types'
import type { UploadedFileInfo } from '@/config/chat'

/** A single-file request must return one complete runtime attachment, not an array. */
export function isUploadedFileInfo(value: unknown): value is UploadedFileInfo {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return false
  const data = value as Record<string, unknown>
  return (
    typeof data.id === 'string' &&
    data.id.trim().length > 0 &&
    typeof data.name === 'string' &&
    data.name.trim().length > 0 &&
    typeof data.extension === 'string' &&
    typeof data.mime_type === 'string' &&
    typeof data.size === 'number' &&
    Number.isFinite(data.size) &&
    data.size >= 0 &&
    typeof data.created_at === 'number' &&
    Number.isFinite(data.created_at) &&
    typeof data.created_by === 'string' &&
    data.created_by.trim().length > 0 &&
    (data.preview_url == null || typeof data.preview_url === 'string')
  )
}

export async function uploadConversationAttachment(
  file: File,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal,
): Promise<UploadedFileInfo> {
  const data = await apiClient.uploadWithProgress(
    '/api/v1/documents/upload',
    file,
    onProgress,
    signal,
  )
  if (!isUploadedFileInfo(data)) {
    throw new APIError(200, 'INVALID_RESPONSE', te('serverError'))
  }
  return data
}
