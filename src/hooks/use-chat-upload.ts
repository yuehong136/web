import { AttachmentPreviewMode } from './attachment-preview'
import { useAttachmentUpload } from './use-attachment-upload'

/** Chat keeps data URI previews after attachments move into message history. */
export function useChatUpload() {
  return useAttachmentUpload(AttachmentPreviewMode.DataURL)
}

export type UseChatUploadReturn = ReturnType<typeof useChatUpload>
