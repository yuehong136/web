import type { RuntimeAttachment } from '../../features/runtime-workbench/types'

export type RuntimeChatComposerMode = 'hidden' | 'compact' | 'full'

export interface RuntimeChatSendRequest {
  content?: string
  files?: RuntimeAttachment[]
}

/** The unsent text and attachments of a runtime chat composer. */
export interface RuntimeChatDraft {
  content: string
  files: RuntimeAttachment[]
}

export const EMPTY_RUNTIME_CHAT_DRAFT: RuntimeChatDraft = {
  content: '',
  files: [],
}

/**
 * A send that was not accepted returns `false`, and the draft stays as it
 * is; otherwise it returns the run's promise.
 */
export type RuntimeChatSendResult = Promise<void> | false
