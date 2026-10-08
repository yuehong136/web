import { useCallback, useState } from 'react'

type Drafts<T> = Record<string, T>

interface DraftState<T> {
  identity: string
  drafts: Drafts<T>
}

const withoutKey = <T>(drafts: Drafts<T>, key: string): Drafts<T> =>
  Object.fromEntries(Object.entries(drafts).filter(([name]) => name !== key))

/**
 * Unsent chat drafts kept in memory per conversation (ARCH-8). Drafts never
 * reach storage, and a different user or tenant always starts from empty
 * drafts. A draft is cleared only while it still holds the exact value that
 * was submitted, so text typed after an accepted send survives; object drafts
 * (text plus attachments) compare by identity, which every edit replaces.
 */
export function useChatDrafts<T>(identity: string, draftKey: string, empty: T) {
  const [state, setState] = useState<DraftState<T>>({ identity, drafts: {} })
  // 身份变化时丢弃上一身份的全部草稿，而不只是隐藏
  if (state.identity !== identity) {
    setState({ identity, drafts: {} })
  }
  const drafts = state.identity === identity ? state.drafts : undefined

  const update = useCallback(
    (apply: (current: Drafts<T>) => Drafts<T>) => {
      setState((prev) => {
        const current = prev.identity === identity ? prev.drafts : {}
        const next = apply(current)
        return next === prev.drafts ? prev : { identity, drafts: next }
      })
    },
    [identity],
  )

  const setDraft = useCallback(
    (value: T) => update((current) => ({ ...current, [draftKey]: value })),
    [draftKey, update],
  )

  /** Clears a draft only while it still holds the value that was submitted. */
  const clearDraft = useCallback(
    (key: string, submitted: T) =>
      update((current) =>
        Object.hasOwn(current, key) && Object.is(current[key], submitted)
          ? withoutKey(current, key)
          : current,
      ),
    [update],
  )

  /** Carries a draft over when a new conversation receives its server id. */
  const moveDraft = useCallback(
    (from: string, to: string) =>
      update((current) => {
        const draft = current[from]
        if (draft === undefined || Object.is(draft, empty)) return current
        return { ...withoutKey(current, from), [to]: draft }
      }),
    [empty, update],
  )

  const draft =
    drafts && Object.hasOwn(drafts, draftKey) ? drafts[draftKey] : empty
  return { draft, setDraft, clearDraft, moveDraft }
}
