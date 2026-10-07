import { useMemo } from 'react'
import { useAuthStore } from '@/stores'

/**
 * Props for `EntityAvatar` that show the signed-in user the same way in the
 * sidebar, the account menu and every chat transcript.
 */
export function useCurrentUserAvatar() {
  const user = useAuthStore((state) => state.user)
  const name = user?.nickname || user?.username || user?.email || ''
  const src = user?.avatar
  const seed = user?.id
  return useMemo(() => ({ name, src, seed }), [name, src, seed])
}
