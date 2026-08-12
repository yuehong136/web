import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { searchAPI } from '@/api/search'
import { normalizeMindmapTree, type MindmapTreeNode } from './utils'

export interface SearchMindmapParams {
  question: string
  kbIds: string[]
  searchId?: string
  docIds?: string[]
  isShareMode?: boolean
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

export const useSearchMindmap = () => {
  const [mindmap, setMindmap] = useState<MindmapTreeNode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [lastParams, setLastParams] = useState<SearchMindmapParams | null>(null)
  const latestRequestKeyRef = useRef<string>('')

  const mutation = useMutation({
    mutationFn: async (params: SearchMindmapParams) => {
      const payload = params.isShareMode
        ? await searchAPI.mindmapShare({
            question: params.question,
            kb_ids: params.kbIds,
            search_id: params.searchId,
          })
        : await searchAPI.mindmap({
            question: params.question,
            kb_ids: params.kbIds,
            search_id: params.searchId,
            doc_ids: params.docIds,
          })
      return normalizeMindmapTree(payload)
    },
    onSuccess: (data, params) => {
      setMindmap(data)
      setError(data ? null : '当前问题暂无可视化思维导图数据。')
      setLastParams(params)
      setProgress(100)
      setTimeout(() => setProgress(0), 300)
    },
    onError: () => {
      setError('思维导图生成失败，请重试。')
      setProgress(0)
    },
  })

  useEffect(() => {
    if (!mutation.isPending) return
    const timer = setInterval(() => {
      setProgress((current) => {
        if (current >= 92) return current
        return clamp(current + 8, 12, 92)
      })
    }, 220)
    return () => clearInterval(timer)
  }, [mutation.isPending])

  const request = useCallback(
    async (params: SearchMindmapParams, options?: { force?: boolean }) => {
      const normalizedQuestion = params.question.trim()
      if (!normalizedQuestion || !params.kbIds.length) {
        setError('缺少问题或知识库，无法生成思维导图。')
        setMindmap(null)
        return
      }

      const nextParams: SearchMindmapParams = {
        ...params,
        question: normalizedQuestion,
      }
      const requestKey = JSON.stringify(nextParams)
      const shouldSkip =
        !options?.force && latestRequestKeyRef.current === requestKey
      if (shouldSkip) return

      latestRequestKeyRef.current = requestKey
      setError(null)
      setProgress(12)
      await mutation.mutateAsync(nextParams)
    },
    [mutation],
  )

  const refresh = useCallback(async () => {
    if (!lastParams) return
    await request(lastParams, { force: true })
  }, [lastParams, request])

  const reset = useCallback(() => {
    setMindmap(null)
    setError(null)
    setProgress(0)
    latestRequestKeyRef.current = ''
    setLastParams(null)
  }, [])

  return useMemo(
    () => ({
      mindmap,
      error,
      progress,
      isLoading: mutation.isPending,
      hasData: !!mindmap,
      request,
      refresh,
      reset,
      lastParams,
    }),
    [
      error,
      lastParams,
      mindmap,
      mutation.isPending,
      progress,
      refresh,
      request,
      reset,
    ],
  )
}
