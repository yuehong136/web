import { useMemo } from 'react'
import { useAuthStore } from '@/stores/auth'

let nextActor = 0

/** Opaque cache identity; access credentials never become a Query key. */
export function useDocumentParserActor() {
  const token = useAuthStore((state) => state.token)
  const userId = useAuthStore((state) => state.user?.id)
  return useMemo(
    () => ({
      key: ++nextActor,
      isCurrent: () => {
        const state = useAuthStore.getState()
        return state.token === token && state.user?.id === userId
      },
    }),
    [token, userId],
  )
}
