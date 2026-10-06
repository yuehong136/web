import { useMemo, useSyncExternalStore } from 'react'
import { useQuery } from '@tanstack/react-query'
import { APIError } from '@/api/client'
import {
  documentImageKeys,
  readDocumentImage,
  resolveDocumentImageUrl,
  type DocumentImageSource,
} from '@/api/document-images'
import {
  getDocumentImageEpoch,
  subscribeDocumentImageEpoch,
  createDocumentImageLeaseStore,
  openDocumentImageWindow,
} from '@/lib/document-image-resources'
import { useAuthStore } from '@/stores/auth'

export function useDocumentImageEpoch() {
  return useSyncExternalStore(
    subscribeDocumentImageEpoch,
    getDocumentImageEpoch,
    getDocumentImageEpoch,
  )
}

export function useDocumentImage(source: DocumentImageSource | null) {
  const epoch = useDocumentImageEpoch()
  const authenticated = useAuthStore(
    (state) => !!state.isAuthenticated && !!state.user?.id && !!state.token,
  )
  let sourceUrl = ''
  let sourceError: APIError | undefined
  try {
    if (source) sourceUrl = resolveDocumentImageUrl(source)
  } catch (error) {
    sourceError = error as APIError
  }
  const query = useQuery({
    queryKey: documentImageKeys.image(epoch, sourceUrl),
    queryFn: ({ signal }) => readDocumentImage(source!, signal),
    enabled: !!source && !!sourceUrl && authenticated,
    retry: false,
    staleTime: Infinity,
    gcTime: 0,
    refetchOnReconnect: false,
  })
  const leaseStore = useMemo(
    () =>
      createDocumentImageLeaseStore(
        authenticated ? (query.data ?? null) : null,
        epoch,
        sourceUrl,
      ),
    [query.data, authenticated, epoch, sourceUrl],
  )
  const objectUrl = useSyncExternalStore(
    leaseStore.subscribe,
    leaseStore.getSnapshot,
    leaseStore.getServerSnapshot,
  )
  const error =
    sourceError ??
    (!authenticated && source
      ? new APIError(401, '401', 'Unauthorized')
      : query.error)
  return {
    objectUrl,
    error,
    isLoading: !!source && !error && !objectUrl,
    retry: () => {
      if (authenticated && sourceUrl) void query.refetch()
    },
    openInNewWindow: (title: string) =>
      !!objectUrl &&
      !!query.data &&
      openDocumentImageWindow(query.data, epoch, title, sourceUrl),
  }
}
