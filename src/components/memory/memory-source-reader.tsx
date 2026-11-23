import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { memoryAPI } from '@/api/memory'
import { MutationErrorFeedback } from '@/lib/mutation-error-feedback'
import { boundSourceRange } from '@/lib/memory-source-excerpt'
import { MemorySourceSubmission } from './memory-source-submission'
import { useMemoryCapabilities } from '@/hooks/use-memory-revisions'
import { MemorySourceExcerptView } from './memory-source-excerpt-view'
import type { MemoryBoundSourceReference } from '@/types/memory-startup'
export function MemorySourceReader({
  memoryId,
  source,
  onInvalid,
}: {
  memoryId: string
  source: MemoryBoundSourceReference
  onInvalid: () => void
}) {
  const capabilities = useMemoryCapabilities(memoryId)
  const generation = useRef(0),
    mounted = useRef(false),
    controller = useRef<AbortController | null>(null)
  const [view, setView] = useState<{
      text: string
      range: { start: number; end: number; total: number }
      next: number | null
      history: number[]
    } | null>(null),
    [pending, setPending] = useState(false),
    [error, setError] = useState<string>()
  const stop = useCallback(() => {
    generation.current++
    controller.current?.abort()
  }, [])
  useLayoutEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      stop()
    }
  }, [stop])
  const invalidate = useCallback(() => {
    stop()
    setView(null)
    setPending(false)
    setError('memory.startup.sourceChanged')
    onInvalid()
  }, [stop, onInvalid])
  const read = useMutation<
    void,
    Error,
    {
      offset: number
      history: number[]
      generation: number
      controller: AbortController
    }
  >({
    gcTime: 0,
    retry: false,
    meta: { errorFeedback: MutationErrorFeedback.Local },
    mutationFn: async (ticket) => {
      const current = () =>
        mounted.current &&
        ticket.generation === generation.current &&
        !ticket.controller.signal.aborted
      try {
        const result = await memoryAPI.startup.source(
          memoryId,
          source,
          ticket.offset,
          512,
          ticket.controller.signal,
        )
        if (!current()) return
        const range = boundSourceRange(
          result,
          source,
          memoryId,
          ticket.offset,
          512,
        )
        setView({
          text: result.excerpt!,
          range,
          next: result.next_offset,
          history: ticket.history,
        })
        setError(undefined)
      } catch {
        if (current()) {
          invalidate()
        }
      } finally {
        if (current()) setPending(false)
      }
    },
  })
  const load = (offset: number, history: number[]) => {
    generation.current++
    controller.current?.abort()
    const abort = new AbortController()
    controller.current = abort
    setView(null)
    setError(undefined)
    setPending(true)
    read.mutate({
      offset,
      history,
      generation: generation.current,
      controller: abort,
    })
  }
  return (
    <div className="min-w-0 space-y-space-base">
      <MemorySourceSubmission
        key={JSON.stringify(source)}
        memoryId={memoryId}
        sourceId={source.source_id}
        binding={source}
        onInvalid={invalidate}
        supported={capabilities.data?.structured_sources?.supported === true}
      />
      <MemorySourceExcerptView
        sourceId={source.source_id}
        sourceRevision={source.source_revision}
        sourceGeneration={source.source_generation}
        contentHash={source.content_sha256}
        excerpt={view?.text ?? null}
        range={view?.range}
        pending={pending}
        errorKey={error}
        previous={!!view?.history.length}
        next={view?.next !== null && view?.next !== undefined}
        onFirst={() => load(0, [])}
        onPrevious={() => {
          if (view?.history.length)
            load(view.history.at(-1)!, view.history.slice(0, -1))
        }}
        onNext={() => {
          if (view?.next !== null && view?.next !== undefined)
            load(view.next, [...view.history, view.range.start])
        }}
      />
    </div>
  )
}
