import { useCallback, useRef, useState } from 'react'
import { EventSourceParserStream } from 'eventsource-parser/stream'
import { conversationAPI } from '@/api/conversation'
import { knowledgeAPI } from '@/api/knowledge'
import { searchAPI } from '@/api/search'
import {
  SearchExecutionPhase,
  type ChunkResult,
  type DocAgg,
  type SearchApp,
  type SearchConfig,
  type SearchTurn,
} from '@/types/search'

const isRunningPhase = (phase: SearchExecutionPhase) => {
  return (
    phase === SearchExecutionPhase.RETRIEVING ||
    phase === SearchExecutionPhase.SUMMARIZING ||
    phase === SearchExecutionPhase.RELATED
  )
}

export const useSearchExecution = (searchApp: SearchApp | null, appliedConfig?: SearchConfig) => {
  const [turns, setTurns] = useState<SearchTurn[]>([])
  const [phase, setPhase] = useState<SearchExecutionPhase>(SearchExecutionPhase.IDLE)
  const abortControllerRef = useRef<AbortController | null>(null)
  const streamFrameRef = useRef<number | null>(null)
  const pendingStreamPatchRef = useRef<{ turnId: string; summary: string; thinking: string } | null>(null)

  const updateTurn = useCallback((turnId: string, partial: Partial<SearchTurn>) => {
    setTurns((prev) => prev.map((turn) => (turn.id === turnId ? { ...turn, ...partial } : turn)))
  }, [])

  const resetPendingStreamPatch = useCallback(() => {
    if (streamFrameRef.current !== null) {
      cancelAnimationFrame(streamFrameRef.current)
      streamFrameRef.current = null
    }
    pendingStreamPatchRef.current = null
  }, [])

  const flushPendingStreamPatch = useCallback(() => {
    if (streamFrameRef.current !== null) {
      cancelAnimationFrame(streamFrameRef.current)
      streamFrameRef.current = null
    }
    const pendingPatch = pendingStreamPatchRef.current
    if (!pendingPatch) return
    pendingStreamPatchRef.current = null
    updateTurn(pendingPatch.turnId, {
      summary: pendingPatch.summary,
      thinking: pendingPatch.thinking,
      phase: SearchExecutionPhase.SUMMARIZING,
    })
  }, [updateTurn])

  const scheduleStreamPatch = useCallback(
    (turnId: string, summary: string, thinking: string) => {
      pendingStreamPatchRef.current = { turnId, summary, thinking }
      if (streamFrameRef.current !== null) return

      streamFrameRef.current = requestAnimationFrame(() => {
        streamFrameRef.current = null
        const pendingPatch = pendingStreamPatchRef.current
        if (!pendingPatch) return
        pendingStreamPatchRef.current = null
        updateTurn(pendingPatch.turnId, {
          summary: pendingPatch.summary,
          thinking: pendingPatch.thinking,
          phase: SearchExecutionPhase.SUMMARIZING,
        })
      })
    },
    [updateTurn]
  )

  const search = useCallback(
    async (query: string, options?: { docIds?: string[] }) => {
      const effectiveConfig = appliedConfig || searchApp?.search_config
      if (!searchApp || !query.trim()) return
      if (!effectiveConfig?.kb_ids?.length) return

      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        resetPendingStreamPatch()
        setTurns((prev) =>
          prev.map((turn) =>
            turn.isStreaming ? { ...turn, isStreaming: false, phase: SearchExecutionPhase.STOPPED } : turn
          )
        )
      }

      const abortController = new AbortController()
      abortControllerRef.current = abortController
      const { signal } = abortController

      const turnId = `turn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const config = effectiveConfig

      const newTurn: SearchTurn = {
        id: turnId,
        query: query.trim(),
        summary: '',
        thinking: '',
        isStreaming: true,
        chunks: [],
        docAggs: [],
        relatedQuestions: [],
        total: 0,
        phase: SearchExecutionPhase.RETRIEVING,
      }
      setTurns((prev) => [...prev, newTurn])
      setPhase(SearchExecutionPhase.RETRIEVING)

      try {
        const metadataCondition =
          config.meta_data_filter?.method === 'manual' && config.meta_data_filter.manual?.length
            ? {
                logic: config.meta_data_filter.logic || 'and',
                conditions: config.meta_data_filter.manual.map((item) => ({
                  name: item.key,
                  comparison_operator: item.op,
                  value: item.value,
                })),
              }
            : undefined

        const retrievalPromise = knowledgeAPI.retrievalTest
          .test({
            kb_ids: config.kb_ids,
            question: query.trim(),
            page: 1,
            size: config.top_k || 8,
            doc_ids: options?.docIds?.length ? options.docIds : null,
            similarity_threshold: config.similarity_threshold,
            vector_similarity_weight: config.vector_similarity_weight,
            use_kg: config.use_kg,
            rerank_id: config.use_rerank ? config.rerank_id || null : null,
            highlight: true,
            keyword: true,
            metadata_condition: metadataCondition,
          })
          .then((result) => {
            if (signal.aborted) return
            updateTurn(turnId, {
              chunks: result.chunks as ChunkResult[],
              docAggs: result.doc_aggs as DocAgg[],
              total: result.total,
              phase: config.summary
                ? SearchExecutionPhase.SUMMARIZING
                : SearchExecutionPhase.RELATED,
            })
          })

        const summaryPromise = config.summary
          ? (async () => {
              setPhase(SearchExecutionPhase.SUMMARIZING)

              const response = await searchAPI.askStream({
                question: query.trim(),
                kb_ids: config.kb_ids,
                search_id: searchApp.id,
                doc_ids: options?.docIds,
                signal,
              })

              if (!response.ok || !response.body) {
                throw new Error(`HTTP ${response.status}`)
              }

              const reader = response.body
                .pipeThrough(new TextDecoderStream())
                .pipeThrough(new EventSourceParserStream())
                .getReader()

              while (true) {
                const { done, value } = await reader.read()
                if (done) break
                if (signal.aborted) {
                  await reader.cancel()
                  break
                }

                try {
                  const jsonStr = value?.data
                  if (!jsonStr) continue
                  const data = JSON.parse(jsonStr)
                  if (data?.data === true) continue
                  if (data?.retcode !== 0 || !data?.data?.answer) continue

                  const rawAnswer = String(data.data.answer)
                  const thinkMatch = rawAnswer.match(/<think(?:ing)?>([\s\S]*?)(?:<\/think(?:ing)?>|$)/)
                  const thinking = thinkMatch?.[1]?.trim() || ''

                  const content = rawAnswer
                    .replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/g, '')
                    .replace(/<think(?:ing)?>[\s\S]*$/, '')
                    .trim()

                  scheduleStreamPatch(turnId, content, thinking)
                } catch {
                  // Ignore malformed SSE chunk.
                }
              }

              flushPendingStreamPatch()
            })()
          : Promise.resolve()

        await Promise.allSettled([retrievalPromise, summaryPromise])

        if (signal.aborted) {
          updateTurn(turnId, { isStreaming: false, phase: SearchExecutionPhase.STOPPED })
          setPhase(SearchExecutionPhase.STOPPED)
          return
        }

        if (config.related_search) {
          setPhase(SearchExecutionPhase.RELATED)
          updateTurn(turnId, { phase: SearchExecutionPhase.RELATED })
          try {
            const related = await conversationAPI.generateRelatedQuestions({
              question: query.trim(),
            })

            if (!signal.aborted) {
              updateTurn(turnId, { relatedQuestions: related?.slice(0, 5) ?? [] })
            }
          } catch {
            // Non-critical failure.
          }
        }

        updateTurn(turnId, { isStreaming: false, phase: SearchExecutionPhase.COMPLETE })
        setPhase(SearchExecutionPhase.COMPLETE)
      } catch (error: unknown) {
        const aborted = signal.aborted || (error as { name?: string })?.name === 'AbortError'
        if (aborted) {
          updateTurn(turnId, { isStreaming: false, phase: SearchExecutionPhase.STOPPED })
          setPhase(SearchExecutionPhase.STOPPED)
          return
        }

        updateTurn(turnId, {
          isStreaming: false,
          phase: SearchExecutionPhase.ERROR,
          errorMessage: '搜索执行失败，请稍后重试。',
        })
        setPhase(SearchExecutionPhase.ERROR)
      }
    },
    [appliedConfig, flushPendingStreamPatch, resetPendingStreamPatch, scheduleStreamPatch, searchApp, updateTurn]
  )

  const stop = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    resetPendingStreamPatch()

    setTurns((prev) =>
      prev.map((turn) =>
        turn.isStreaming
          ? { ...turn, isStreaming: false, phase: SearchExecutionPhase.STOPPED }
          : turn
      )
    )
    setPhase(SearchExecutionPhase.STOPPED)
  }, [resetPendingStreamPatch])

  const clear = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    resetPendingStreamPatch()
    setTurns([])
    setPhase(SearchExecutionPhase.IDLE)
  }, [resetPendingStreamPatch])

  return {
    turns,
    phase,
    isSearching: isRunningPhase(phase),
    search,
    stop,
    clear,
  }
}
