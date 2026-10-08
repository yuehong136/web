import { useChatDrafts } from '@/hooks/use-chat-drafts'

/** Draft key for a conversation that has no server id yet. */
export const NEW_CONVERSATION_DRAFT = 'new'

/**
 * Unsent Home drafts, kept in memory per conversation through the shared
 * chat draft store. Drafts never reach storage, and a different user or
 * tenant always starts from empty drafts.
 */
export function useHomeDrafts(identity: string, draftKey: string) {
  return useChatDrafts(identity, draftKey, '')
}
