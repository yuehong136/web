import { useCallback } from 'react'
import { useChatDrafts } from '@/hooks/use-chat-drafts'
import { useAuthStore } from '@/stores/auth'
import { EMPTY_RUNTIME_CHAT_DRAFT } from '../../components/runtime-chat/types'

/** Draft key segment for a conversation that has no session yet. */
const NEW_SESSION_DRAFT = 'new'

/**
 * Explore composer drafts (text plus attachments), kept in memory per user,
 * tenant, Agent and conversation like Home's. A draft is cleared only when
 * the run it was sent from takes ownership, so a refused send or a closed
 * Begin inputs dialog keeps it, and text typed while an answer streams
 * survives. A new conversation's draft moves along when its session is
 * created.
 */
export function useExploreDrafts(
  canvasId: string,
  sessionId: string,
  isNew: boolean,
) {
  const user = useAuthStore((state) => state.user)
  const identity = `${user?.id ?? ''}:${user?.tenant_id ?? ''}`
  const draftKey = `${canvasId}:${isNew ? NEW_SESSION_DRAFT : sessionId}`
  const { draft, setDraft, clearDraft, moveDraft } = useChatDrafts(
    identity,
    draftKey,
    EMPTY_RUNTIME_CHAT_DRAFT,
  )

  const clearAccepted = useCallback(
    (submitted: unknown) => clearDraft(draftKey, submitted),
    [clearDraft, draftKey],
  )

  const moveNewDraft = useCallback(
    (createdSessionId: string) =>
      moveDraft(
        `${canvasId}:${NEW_SESSION_DRAFT}`,
        `${canvasId}:${createdSessionId}`,
      ),
    [canvasId, moveDraft],
  )

  return { draft, setDraft, clearAccepted, moveNewDraft }
}
