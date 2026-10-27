import { useEffect, useState, type MutableRefObject } from 'react'
import { useAuthStore } from '@/stores/auth'
import { sameRequestIdentity } from '@/lib/request-identity'

export interface HomeScopeSync {
  scope: string
  target: string | null
}

/** Synchronous auth revocation covers transitions React may batch back to A. */
export function useHomeScope({
  identity,
  appId,
  selectedConversationId,
  syncedRef,
  localThreadIdRef,
  detachRequest,
  resetConversation,
  loadHistory,
}: {
  identity: string
  appId?: string
  selectedConversationId?: string | null
  syncedRef: MutableRefObject<HomeScopeSync | null>
  localThreadIdRef: MutableRefObject<string>
  detachRequest: () => void
  resetConversation: () => void
  loadHistory: (id: string) => Promise<void>
}) {
  const [authEpoch, setAuthEpoch] = useState(0)
  const scopeKey = `${identity}|${appId ?? ''}|${authEpoch}`
  useEffect(
    () =>
      useAuthStore.subscribe((next, previous) => {
        if (sameRequestIdentity(next, previous)) return
        // Revoke before returning from the store transition, before any old frame.
        syncedRef.current = null
        detachRequest()
        resetConversation()
        setAuthEpoch((value) => value + 1)
      }),
    [detachRequest, resetConversation, syncedRef],
  )
  useEffect(() => {
    const target = selectedConversationId ?? null
    const synced = syncedRef.current
    if (synced?.scope === scopeKey && synced.target === target) return
    syncedRef.current = { scope: scopeKey, target }
    detachRequest()
    resetConversation()
    localThreadIdRef.current = crypto.randomUUID()
    if (target) void loadHistory(target)
  }, [
    scopeKey,
    selectedConversationId,
    syncedRef,
    localThreadIdRef,
    detachRequest,
    resetConversation,
    loadHistory,
  ])
  return scopeKey
}
