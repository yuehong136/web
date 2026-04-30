import type { RuntimeAttachment } from '../../features/runtime-workbench/types'

export type RuntimeChatComposerMode = 'hidden' | 'compact' | 'full'

export interface RuntimeChatSendRequest {
  content?: string
  files?: RuntimeAttachment[]
}
