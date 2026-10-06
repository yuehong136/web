import { useCallback, useState } from 'react'

/** Draft key for a conversation that has no server id yet. */
export const NEW_CONVERSATION_DRAFT = 'new'

type Drafts = Record<string, string>

interface DraftState {
  identity: string
  drafts: Drafts
}

const EMPTY_DRAFTS: Drafts = {}

const withoutKey = (drafts: Drafts, key: string): Drafts =>
  Object.fromEntries(Object.entries(drafts).filter(([name]) => name !== key))

/**
 * Unsent Home drafts, kept in memory per conversation. Drafts never reach
 * storage, and a different user or tenant always starts from empty drafts.
 */
export function useHomeDrafts(identity: string, draftKey: string) {
  const [state, setState] = useState<DraftState>({
    identity,
    drafts: EMPTY_DRAFTS,
  })
  // 身份变化时丢弃上一身份的全部草稿，而不只是隐藏
  if (state.identity !== identity) {
    setState({ identity, drafts: EMPTY_DRAFTS })
  }
  const drafts = state.identity === identity ? state.drafts : EMPTY_DRAFTS

  const update = useCallback(
    (apply: (current: Drafts) => Drafts) => {
      setState((prev) => {
        const current = prev.identity === identity ? prev.drafts : EMPTY_DRAFTS
        const next = apply(current)
        return next === prev.drafts ? prev : { identity, drafts: next }
      })
    },
    [identity],
  )

  const setDraft = useCallback(
    (value: string) => update((current) => ({ ...current, [draftKey]: value })),
    [draftKey, update],
  )

  /** Clears a draft only while it still holds the text that was submitted. */
  const clearDraft = useCallback(
    (key: string, submitted: string) =>
      update((current) =>
        current[key] === submitted ? withoutKey(current, key) : current,
      ),
    [update],
  )

  /** Carries a draft over when a new conversation receives its server id. */
  const moveDraft = useCallback(
    (from: string, to: string) =>
      update((current) =>
        current[from]
          ? { ...withoutKey(current, from), [to]: current[from] }
          : current,
      ),
    [update],
  )

  return { draft: drafts[draftKey] ?? '', setDraft, clearDraft, moveDraft }
}
