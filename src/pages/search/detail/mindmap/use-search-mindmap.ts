import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { searchAPI } from '@/api/search'
import { isAbortError } from '@/api/request-abort'
import { MutationErrorFeedback } from '@/lib/mutation-error-feedback'
import { normalizeMindmapTree, type MindmapTreeNode } from './utils'

export interface SearchMindmapParams {
  question: string
  kbIds: string[]
  searchId?: string
  docIds?: string[]
  isShareMode?: boolean
}

/** A request has loading state, not an invented percentage or timer. */
export function useSearchMindmap() {
  const [mindmap, setMindmap] = useState<MindmapTreeNode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setLoading] = useState(false)
  const [lastParams, setLastParams] = useState<SearchMindmapParams | null>(null)
  const controller = useRef<AbortController | null>(null)
  const revision = useRef(0)
  const previousKey = useRef<string | null>(null)
  const { mutateAsync } = useMutation({
    meta: { errorFeedback: MutationErrorFeedback.Local },
    mutationFn: async ({
      params,
      signal,
    }: {
      params: SearchMindmapParams
      signal: AbortSignal
    }) => {
      const payload = {
        question: params.question,
        kb_ids: params.kbIds,
        search_id: params.searchId,
        doc_ids: params.docIds,
        signal,
      }
      return normalizeMindmapTree(
        params.isShareMode
          ? await searchAPI.mindmapShare(payload)
          : await searchAPI.mindmap(payload),
      )
    },
  })
  useEffect(
    () => () => {
      revision.current++
      controller.current?.abort()
    },
    [],
  )
  const request = useCallback(
    async (params: SearchMindmapParams, options?: { force?: boolean }) => {
      const normalized = { ...params, question: params.question.trim() }
      if (!normalized.question || !params.kbIds.length) {
        setError('searchPage.workspace.mapMissing')
        return
      }
      const key = JSON.stringify(normalized)
      if (!options?.force && previousKey.current === key) return
      controller.current?.abort()
      const ownController = new AbortController()
      controller.current = ownController
      const ownRevision = ++revision.current
      previousKey.current = key
      setLastParams(normalized)
      setError(null)
      setMindmap(null)
      setLoading(true)
      try {
        const result = await mutateAsync({
          params: normalized,
          signal: ownController.signal,
        })
        if (ownRevision !== revision.current) return
        setMindmap(result)
        setError(result ? null : 'searchPage.workspace.mapEmpty')
        if (!result) previousKey.current = null
      } catch (failure) {
        if (ownRevision !== revision.current || isAbortError(failure)) return
        setError('searchPage.workspace.mapFailed')
        previousKey.current = null
      } finally {
        if (ownRevision === revision.current) setLoading(false)
      }
    },
    [mutateAsync],
  )
  const refresh = useCallback(async () => {
    if (lastParams) await request(lastParams, { force: true })
  }, [lastParams, request])
  const cancel = useCallback(() => {
    revision.current++
    controller.current?.abort()
    previousKey.current = null
    setLoading(false)
  }, [])
  const reset = useCallback(() => {
    cancel()
    setMindmap(null)
    setError(null)
    setLastParams(null)
  }, [cancel])
  return {
    mindmap,
    error,
    isLoading,
    hasData: !!mindmap,
    request,
    refresh,
    reset,
    cancel,
    lastParams,
  }
}
