import { useAuthStore } from '@/stores/auth'
import { queryClient } from '@/lib/query-client'
import { documentImageKeys } from '@/api/document-images'

let epoch = 0
const listeners = new Set<() => void>()
type Lease = { url: string; release: () => void }
type Resource = { url: string; references: number; epoch: number }
const resources = new Map<Blob, Resource>()
const windows = new Set<() => void>()

function releaseOwnerResources() {
  epoch += 1
  for (const dispose of [...windows]) dispose()
  for (const resource of resources.values()) URL.revokeObjectURL(resource.url)
  resources.clear()
  void queryClient.cancelQueries({ queryKey: documentImageKeys.all() })
  queryClient.removeQueries({ queryKey: documentImageKeys.all() })
  for (const listener of listeners) listener()
}

let ownerSubscribed = false
export const getDocumentImageEpoch = () => {
  subscribeToOwner()
  return epoch
}
export const subscribeDocumentImageEpoch = (listener: () => void) => {
  subscribeToOwner()
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

// Initialize when the feature is used, after the application auth store exists.
function subscribeToOwner() {
  if (ownerSubscribed) return
  ownerSubscribed = true
  window.addEventListener('pagehide', releaseOwnerResources)
  useAuthStore.subscribe((state, previous) => {
    if (
      state.token === previous.token &&
      state.user?.id === previous.user?.id &&
      state.isAuthenticated === previous.isAuthenticated
    )
      return
    releaseOwnerResources()
  })
}

export function retainDocumentImage(blob: Blob, ownerEpoch: number): Lease {
  subscribeToOwner()
  if (ownerEpoch !== epoch) throw new DOMException('Aborted', 'AbortError')
  let resource = resources.get(blob)
  if (!resource) {
    resource = { url: URL.createObjectURL(blob), references: 0, epoch }
    resources.set(blob, resource)
  }
  resource.references += 1
  let released = false
  return {
    url: resource.url,
    release: () => {
      if (released) return
      released = true
      if (resources.get(blob) !== resource) return
      resource.references -= 1
      if (resource.references === 0) {
        URL.revokeObjectURL(resource.url)
        resources.delete(blob)
      }
    },
  }
}

/** React subscribes to a lease; render itself never allocates object URLs. */
export function createDocumentImageLeaseStore(
  blob: Blob | null,
  ownerEpoch: number,
) {
  let lease: Lease | null = null
  const subscribers = new Set<() => void>()
  return {
    getSnapshot: () => (ownerEpoch === epoch ? (lease?.url ?? null) : null),
    getServerSnapshot: () => null,
    subscribe: (listener: () => void) => {
      if (blob && ownerEpoch === epoch && !lease)
        lease = retainDocumentImage(blob, ownerEpoch)
      subscribers.add(listener)
      return () => {
        subscribers.delete(listener)
        if (!subscribers.size) {
          lease?.release()
          lease = null
        }
      }
    },
  }
}

/** Retains an independent lease until the window closes or the owner changes. */
export function openDocumentImageWindow(
  blob: Blob,
  ownerEpoch: number,
  title: string,
): boolean {
  if (ownerEpoch !== epoch) return false
  // noopener window.open returns null even on success, preventing owner cleanup.
  // Start blank synchronously, sever opener before placing only our verified blob.
  const popup = window.open('', '_blank')
  if (!popup) return false
  let lease: Lease | undefined
  let timer: ReturnType<typeof setInterval> | undefined
  const dispose = () => {
    if (timer) clearInterval(timer)
    popup.close()
    lease?.release()
    windows.delete(dispose)
  }
  try {
    popup.opener = null
    lease = retainDocumentImage(blob, ownerEpoch)
    popup.document.title = title
    const policy = popup.document.createElement('meta')
    policy.name = 'referrer'
    policy.content = 'no-referrer'
    const image = popup.document.createElement('img')
    image.referrerPolicy = 'no-referrer'
    image.alt = title
    image.src = lease.url
    image.style.maxWidth = '100%'
    popup.document.head.append(policy)
    popup.document.body.append(image)
    windows.add(dispose)
    timer = setInterval(() => {
      if (popup.closed) dispose()
    }, 500)
    return true
  } catch {
    dispose()
    return false
  }
}
