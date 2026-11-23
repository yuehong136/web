import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { APIError } from '@/api/client'
import { memoryAPI } from '@/api/memory'
import { useAuthStore } from '@/stores/auth'
import { MutationErrorFeedback } from '@/lib/mutation-error-feedback'
import { validateSourceProvenance } from '@/lib/memory-source-provenance'
import { sourceProvenanceChanged } from './memory-source-provenance-fence'
import type {
  MemorySourceBinding,
  MemorySourceProvenance,
} from '@/types/memory-sources'
export function useMemorySourceProvenance(
  memoryId: string,
  sourceId: string,
  binding?: MemorySourceBinding,
) {
  const cache = useQueryClient(),
    actor = useAuthStore((state) => state.token)
  const owner = JSON.stringify([memoryId, sourceId, actor, binding])
  const generation = useRef(0),
    mounted = useRef(false),
    controller = useRef<AbortController | null>(null)
  const [state, setState] = useState<{
    owner: string
    value: MemorySourceProvenance | null
    pending: boolean
    error?: string
  }>({ owner, value: null, pending: false })
  if (state.owner !== owner) setState({ owner, value: null, pending: false })
  const visible = useRef<MemorySourceProvenance | null>(null)
  const clear = useCallback(
    (stale = false) => {
      generation.current++
      controller.current?.abort()
      visible.current = null
      setState({
        owner,
        value: null,
        pending: false,
        error: stale ? 'memory.sources.changed' : undefined,
      })
    },
    [owner],
  )
  const stop = useCallback(() => {
    generation.current++
    controller.current?.abort()
    visible.current = null
  }, [])
  useLayoutEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      stop()
    }
  }, [owner, stop])
  useLayoutEffect(
    () =>
      cache.getQueryCache().subscribe(() => {
        if (
          sourceProvenanceChanged(
            cache,
            memoryId,
            sourceId,
            visible.current ?? binding,
          )
        )
          clear(true)
      }),
    [cache, memoryId, sourceId, binding, clear],
  )
  const mutation = useMutation<
    void,
    Error,
    {
      generation: number
      controller: AbortController
      binding?: MemorySourceBinding
    }
  >({
    gcTime: 0,
    retry: false,
    meta: { errorFeedback: MutationErrorFeedback.Local },
    mutationFn: async (ticket) => {
      const current = () =>
        mounted.current &&
        generation.current === ticket.generation &&
        !ticket.controller.signal.aborted
      try {
        const result = await memoryAPI.sources.provenance(memoryId, sourceId, {
          binding: ticket.binding,
          includeSegments: false,
          signal: ticket.controller.signal,
        })
        if (!current()) return
        try {
          validateSourceProvenance(result, memoryId, sourceId, ticket.binding)
        } catch {
          clear(true)
          return
        }
        if (sourceProvenanceChanged(cache, memoryId, sourceId, result)) {
          clear(true)
          return
        }
        visible.current = result
        setState({ owner, value: result, pending: false })
      } catch (error) {
        if (current()) {
          visible.current = null
          setState({
            owner,
            value: null,
            pending: false,
            error:
              error instanceof APIError && [404, 409].includes(error.status)
                ? 'memory.sources.changed'
                : 'memory.sources.failed',
          })
        }
      }
    },
  })
  const read = () => {
    const previous = visible.current
    const expected =
      binding && previous?.provenance_sha256
        ? { ...binding, provenance_sha256: previous.provenance_sha256 }
        : binding
    clear()
    if (sourceProvenanceChanged(cache, memoryId, sourceId, binding)) {
      clear(true)
      return
    }
    const abort = new AbortController()
    controller.current = abort
    setState({ owner, value: null, pending: true })
    mutation.mutate({
      generation: generation.current,
      controller: abort,
      binding: expected,
    })
  }
  return {
    ...(state.owner === owner
      ? state
      : { value: null, pending: false, error: undefined }),
    read,
    clear,
  }
}
