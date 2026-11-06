import { useCallback, useEffect, useRef, useState } from 'react'
import { knowledgeAPI } from '@/api/knowledge'
import type { ChunkResult, DocAgg, SearchTurn } from '@/types/search'

type RetrievalRequest = Parameters<typeof knowledgeAPI.retrievalTest.test>[0]
interface Snapshot {
  request: RetrievalRequest
  controller?: AbortController
}

/** Refine a submitted round without generating another answer or discarding source choices. */
export function useSearchRetrieval(
  scopeKey: string,
  updateTurn: (id: string, partial: Partial<SearchTurn>) => void,
) {
  const snapshots = useRef(new Map<string, Snapshot>())
  const [resultSize, setResultSize] = useState(10)
  const [sizes, setSizes] = useState<Record<string, number>>({})
  const [pending, setPending] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [sources, setSources] = useState<Record<string, DocAgg[]>>({})
  const abortAll = useCallback(() => {
    for (const snapshot of snapshots.current.values())
      snapshot.controller?.abort()
    snapshots.current.clear()
  }, [])
  const reset = useCallback(() => {
    abortAll()
    setResultSize(10)
    setSizes({})
    setPending({})
    setErrors({})
    setSources({})
  }, [abortAll])
  const [previousScope, setPreviousScope] = useState(scopeKey)
  if (previousScope !== scopeKey) {
    setPreviousScope(scopeKey)
    setResultSize(10)
    setSizes({})
    setPending({})
    setErrors({})
    setSources({})
  }
  useEffect(() => abortAll, [scopeKey, abortAll])

  const register = useCallback((turnId: string, request: RetrievalRequest) => {
    snapshots.current.set(turnId, { request })
    setSizes((previous) => ({ ...previous, [turnId]: request.size ?? 10 }))
  }, [])
  const captureSources = useCallback((turnId: string, options: DocAgg[]) => {
    setSources((values) => ({ ...values, [turnId]: options }))
  }, [])

  const refine = useCallback(
    async (
      turnId: string,
      change: { size?: number; docIds?: string[] | null },
    ) => {
      const previous = snapshots.current.get(turnId)
      if (!previous) return
      previous.controller?.abort()
      const request = { ...previous.request, page: 1 }
      if (change.size !== undefined) {
        request.size = change.size
        setResultSize(change.size)
        setSizes((values) => ({ ...values, [turnId]: change.size! }))
      }
      if (Object.hasOwn(change, 'docIds')) request.doc_ids = change.docIds
      const own: Snapshot = { request, controller: new AbortController() }
      snapshots.current.set(turnId, own)
      setPending((values) => ({ ...values, [turnId]: true }))
      setErrors((values) => ({ ...values, [turnId]: false }))
      try {
        // An explicit empty selection means no sources, never all sources.
        const response =
          request.doc_ids?.length === 0
            ? { chunks: [], total: 0, doc_aggs: [] }
            : await knowledgeAPI.retrievalTest.test(request, {
                signal: own.controller!.signal,
              })
        if (snapshots.current.get(turnId) !== own) return
        updateTurn(turnId, {
          chunks: response.chunks as ChunkResult[],
          total: response.total,
          docAggs: response.doc_aggs,
        })
      } catch {
        if (
          snapshots.current.get(turnId) !== own ||
          own.controller!.signal.aborted
        )
          return
        updateTurn(turnId, { chunks: [], total: 0, docAggs: [] })
        setErrors((values) => ({ ...values, [turnId]: true }))
      } finally {
        if (snapshots.current.get(turnId) === own)
          setPending((values) => ({ ...values, [turnId]: false }))
      }
    },
    [updateTurn],
  )

  return {
    resultSize,
    sizes,
    pending,
    errors,
    sources,
    captureSources,
    register,
    refine,
    reset,
  }
}
