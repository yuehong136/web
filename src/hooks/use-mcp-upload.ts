import { useCallback } from 'react'
import { AttachmentPreviewMode } from './attachment-preview'
import { useAttachmentUpload } from './use-attachment-upload'

/** MCP consumes uploaded attachment IDs through enhanced_chat_sse.files. */
export function useMcpUpload() {
  const upload = useAttachmentUpload(AttachmentPreviewMode.ObjectURL)
  const { getUploadedFiles } = upload
  const getFileIds = useCallback(
    () => getUploadedFiles().map((file) => file.id),
    [getUploadedFiles],
  )
  return { ...upload, getFileIds }
}

export type UseMcpUploadReturn = ReturnType<typeof useMcpUpload>
