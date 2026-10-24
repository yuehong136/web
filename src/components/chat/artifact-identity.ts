import { useAuthStore } from '@/stores/auth'
import { sameRequestIdentity as sameArtifactIdentity } from '@/lib/request-identity'
export { sameRequestIdentity as sameArtifactIdentity } from '@/lib/request-identity'

/** Observe every transition, including A -> B -> A inside one React batch. */
export function observeArtifactIdentity(
  onInvalid: () => void,
  signal: AbortSignal,
) {
  let current = !signal.aborted
  let unsubscribe = () => {}
  const release = () => {
    current = false
    unsubscribe()
    signal.removeEventListener('abort', release)
  }
  unsubscribe = useAuthStore.subscribe((next, previous) => {
    if (sameArtifactIdentity(next, previous)) return
    release()
    onInvalid()
  })
  if (signal.aborted) release()
  else signal.addEventListener('abort', release, { once: true })
  return { isCurrent: () => current, release }
}
