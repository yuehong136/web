import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { memoryAPI } from '@/api/memory'
import { APIError } from '@/api/client'
import { MutationErrorFeedback } from '@/lib/mutation-error-feedback'
import {
  memoryStartupChanged,
  memoryStartupObservation,
} from './memory-startup-fences'
import type {
  MemoryStartupPackage,
  MemoryStartupRequest,
} from '@/types/memory-startup'
type Ticket = {
  generation: number
  controller: AbortController
  request: MemoryStartupRequest
  observed: Map<string, number>
}
export function useMemoryStartup(memoryId: string) {
  const cache = useQueryClient(),
    generation = useRef(0),
    controller = useRef<AbortController | null>(null),
    mounted = useRef(false)
  const [value, setValue] = useState<MemoryStartupPackage | null>(null),
    [pending, setPending] = useState(false),
    [error, setError] = useState<string | undefined>()
  const visible = useRef<{
    value: MemoryStartupPackage
    observed: Map<string, number>
  } | null>(null)
  const clear = useCallback((stale = false) => {
    generation.current++
    controller.current?.abort()
    visible.current = null
    setValue(null)
    setPending(false)
    setError(stale ? 'memory.startup.stale' : undefined)
  }, [])
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
  }, [memoryId, stop])
  useLayoutEffect(
    () =>
      cache.getQueryCache().subscribe(() => {
        const current = visible.current
        if (
          current &&
          memoryStartupChanged(cache, current.value, current.observed)
        )
          clear(true)
      }),
    [cache, clear],
  )
  const mutation = useMutation<void, Error, Ticket>({
    gcTime: 0,
    retry: false,
    meta: { errorFeedback: MutationErrorFeedback.Local },
    mutationFn: async (ticket) => {
      const current = () =>
        mounted.current &&
        ticket.generation === generation.current &&
        !ticket.controller.signal.aborted
      try {
        const result = await memoryAPI.startup.preview(
          memoryId,
          ticket.request,
          ticket.controller.signal,
        )
        if (!current()) return
        if (
          result.memory_id !== memoryId ||
          memoryStartupChanged(cache, result, ticket.observed)
        ) {
          clear(true)
          return
        }
        visible.current = { value: result, observed: ticket.observed }
        setValue(result)
        setError(undefined)
      } catch (error) {
        if (current()) {
          visible.current = null
          setValue(null)
          setError(
            error instanceof APIError && error.status === 409
              ? 'memory.startup.stale'
              : 'memory.startup.failed',
          )
        }
      } finally {
        if (current()) setPending(false)
      }
    },
  })
  const preview = (request: MemoryStartupRequest) => {
    clear()
    const abort = new AbortController()
    controller.current = abort
    setPending(true)
    mutation.mutate({
      request,
      generation: generation.current,
      controller: abort,
      observed: memoryStartupObservation(cache, memoryId),
    })
  }
  return { value, pending, error, preview, clear }
}
