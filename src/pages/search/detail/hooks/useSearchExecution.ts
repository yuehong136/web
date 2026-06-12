import { useCallback, useRef, useState } from 'react'
import { conversationAPI } from '@/api/conversation'
import { knowledgeAPI } from '@/api/knowledge'
import { llmAPI } from '@/api/llm'
import { searchAPI } from '@/api/search'
import {
  assertSSEResponse,
  consumeStreamingAnswerChunk,
  createInitialStreamingAnswerState,
  finalizeStreamingAnswerState,
  readSSEStream,
  type SSEEnvelope,
} from '@/lib/streaming'
import {
  SearchExecutionPhase,
  SearchExecutionMode,
  SearchSourceMode,
  type ChunkResult,
  type DocAgg,
  type SearchApp,
  type SearchConfig,
  type SearchTurn,
} from '@/types/search'
import {
  buildRuntimeConfig,
  type SearchRuntimeOptions,
} from './search-runtime-config'

const isRunningPhase = (phase: SearchExecutionPhase) => {
  return (
    phase === SearchExecutionPhase.RETRIEVING ||
    phase === SearchExecutionPhase.SUMMARIZING ||
    phase === SearchExecutionPhase.RELATED
  )
}

interface RawModelItem {
  id?: string
  name?: string
  llm_name?: string
  type?: string
  mdl_type?: string
  available?: boolean
  status?: string
}

interface RawProviderPayload {
  llm?: RawModelItem[]
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const getStreamErrorMessage = (data: unknown): string | null => {
  if (!isRecord(data)) return null

  const code =
    typeof data.retcode === 'number'
      ? data.retcode
      : typeof data.code === 'number'
        ? data.code
        : 0

  if (code === 0) return null

  const payload = data.data
  const payloadAnswer =
    isRecord(payload) && typeof payload.answer === 'string'
      ? payload.answer
      : ''
  const message =
    (typeof data.retmsg === 'string' && data.retmsg) ||
    (typeof data.message === 'string' && data.message) ||
    payloadAnswer ||
    `搜索摘要生成失败，错误码 ${code}`

  return message.replace(/^\*\*ERROR\*\*:\s*/, '')
}

export const useSearchExecution = (
  searchApp: SearchApp | null,
  appliedConfig?: SearchConfig,
) => {
  const [turns, setTurns] = useState<SearchTurn[]>([])
  const [phase, setPhase] = useState<SearchExecutionPhase>(
    SearchExecutionPhase.IDLE,
  )
  const abortControllerRef = useRef<AbortController | null>(null)
  const streamFrameRef = useRef<number | null>(null)
  const pendingStreamPatchRef = useRef<{
    turnId: string
    summary: string
    thinking: string
  } | null>(null)
  const rerankModelNameByIdRef = useRef<Record<string, string>>({})
  const rerankModelMapLoadedRef = useRef(false)

  const updateTurn = useCallback(
    (turnId: string, partial: Partial<SearchTurn>) => {
      setTurns((prev) =>
        prev.map((turn) =>
          turn.id === turnId ? { ...turn, ...partial } : turn,
        ),
      )
    },
    [],
  )

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
    [updateTurn],
  )

  const ensureRerankModelMap = useCallback(async () => {
    if (rerankModelMapLoadedRef.current) return
    const response = await llmAPI.list({ available: true })
    const modelMap: Record<string, string> = {}

    Object.values(response as Record<string, unknown>).forEach(
      (providerValue) => {
        const payload = providerValue as RawProviderPayload | RawModelItem[]
        const llmList = Array.isArray(payload) ? payload : payload?.llm || []

        llmList.forEach((model) => {
          const modelType = model.mdl_type || model.type
          if (modelType !== 'rerank') return
          if (model.available === false || model.status === '0') return

          const displayName = model.llm_name || model.name || model.id
          if (!displayName) return
          if (model.id) modelMap[model.id] = displayName
          modelMap[displayName] = displayName
        })
      },
    )

    rerankModelNameByIdRef.current = modelMap
    rerankModelMapLoadedRef.current = true
  }, [])

  const search = useCallback(
    async (query: string, options?: SearchRuntimeOptions) => {
      const effectiveConfig = appliedConfig || searchApp?.search_config
      if (!searchApp || !query.trim()) return
      if (!effectiveConfig?.kb_ids?.length) return

      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        resetPendingStreamPatch()
        setTurns((prev) =>
          prev.map((turn) =>
            turn.isStreaming
              ? {
                  ...turn,
                  isStreaming: false,
                  phase: SearchExecutionPhase.STOPPED,
                }
              : turn,
          ),
        )
      }

      const abortController = new AbortController()
      abortControllerRef.current = abortController
      const { signal } = abortController
      const startedAt = Date.now()
      const executionMode =
        options?.executionMode || SearchExecutionMode.DEEP_RESEARCH
      const sourceMode = options?.sourceMode || SearchSourceMode.KNOWLEDGE_BASE

      const turnId = `turn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const config = buildRuntimeConfig(
        effectiveConfig,
        executionMode,
        sourceMode,
      )
      const rerankModelId = config.use_rerank ? config.rerank_id || '' : ''
      let rerankModelName = rerankModelId
      if (rerankModelId) {
        try {
          await ensureRerankModelMap()
          rerankModelName =
            rerankModelNameByIdRef.current[rerankModelId] || rerankModelId
        } catch {
          rerankModelName = rerankModelId
        }
      }

      const newTurn: SearchTurn = {
        id: turnId,
        query: query.trim(),
        executionMode,
        sourceMode,
        summaryEnabled: Boolean(config.summary),
        relatedEnabled: Boolean(config.related_search),
        mindmapEnabled: Boolean(config.query_mindmap),
        rerankEnabled: Boolean(config.use_rerank),
        rerankModelId,
        rerankModelName,
        kbIdsSnapshot: [...config.kb_ids],
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
        const rawMetaDataFilter = config.meta_data_filter
        const metaDataFilter =
          rawMetaDataFilter?.method === 'auto'
            ? { method: 'auto' as const }
            : rawMetaDataFilter?.method === 'semi_auto' &&
                rawMetaDataFilter.semi_auto?.length
              ? {
                  method: 'semi_auto' as const,
                  semi_auto: rawMetaDataFilter.semi_auto,
                }
              : rawMetaDataFilter?.method === 'manual' &&
                  rawMetaDataFilter.manual?.length
                ? {
                    method: 'manual' as const,
                    logic: rawMetaDataFilter.logic || 'and',
                    manual: rawMetaDataFilter.manual.map((item) => ({
                      key: item.key,
                      op: item.op,
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
            cross_languages: config.cross_languages?.length
              ? config.cross_languages
              : null,
            meta_data_filter: metaDataFilter,
          })
          .then((result) => {
            if (signal.aborted) return
            updateTurn(turnId, {
              chunks: result.chunks as ChunkResult[],
              docAggs: result.doc_aggs as DocAgg[],
              total: result.total,
              phase: config.summary
                ? SearchExecutionPhase.SUMMARIZING
                : config.related_search
                  ? SearchExecutionPhase.RELATED
                  : SearchExecutionPhase.COMPLETE,
            })
          })

        const summaryPromise = config.summary
          ? (async () => {
              setPhase(SearchExecutionPhase.SUMMARIZING)

              const response = await searchAPI.askStream({
                question: query.trim(),
                kb_ids: config.kb_ids,
                search_id: searchApp.id,
                signal,
              })

              await assertSSEResponse(response)

              let streamState = createInitialStreamingAnswerState()

              // Signal passed through on purpose: the original loop did its
              // own `signal.aborted → reader.cancel() → break`, and the catch
              // below checks the aborted boolean, not the AbortError type.
              await readSSEStream<SSEEnvelope>(response, {
                signal,
                onEvent: (data) => {
                  const streamError = getStreamErrorMessage(data)
                  if (streamError) throw new Error(streamError)

                  const chunk = consumeStreamingAnswerChunk(streamState, data)
                  streamState = chunk.nextState
                  if (chunk.isDone || chunk.isFinal) {
                    streamState = finalizeStreamingAnswerState(streamState)
                  }

                  scheduleStreamPatch(
                    turnId,
                    streamState.content,
                    streamState.thinking,
                  )
                },
              })

              streamState = finalizeStreamingAnswerState(streamState)
              scheduleStreamPatch(
                turnId,
                streamState.content,
                streamState.thinking,
              )
              flushPendingStreamPatch()
            })()
          : Promise.resolve()

        const settledResults = await Promise.allSettled([
          retrievalPromise,
          summaryPromise,
        ])
        const rejectedResult = settledResults.find(
          (result): result is PromiseRejectedResult =>
            result.status === 'rejected',
        )
        if (rejectedResult) {
          throw rejectedResult.reason
        }

        if (signal.aborted) {
          updateTurn(turnId, {
            isStreaming: false,
            phase: SearchExecutionPhase.STOPPED,
            latencyMs: Date.now() - startedAt,
          })
          setPhase(SearchExecutionPhase.STOPPED)
          return
        }

        if (config.related_search) {
          setPhase(SearchExecutionPhase.RELATED)
          updateTurn(turnId, { phase: SearchExecutionPhase.RELATED })
          try {
            const related = await conversationAPI.generateRelatedQuestions({
              question: query.trim(),
              search_id: searchApp.id,
            })

            if (!signal.aborted) {
              updateTurn(turnId, {
                relatedQuestions: related?.slice(0, 5) ?? [],
              })
            }
          } catch {
            // Non-critical failure.
          }
        }

        updateTurn(turnId, {
          isStreaming: false,
          phase: SearchExecutionPhase.COMPLETE,
          latencyMs: Date.now() - startedAt,
        })
        setPhase(SearchExecutionPhase.COMPLETE)
      } catch (error: unknown) {
        const aborted =
          signal.aborted || (error as { name?: string })?.name === 'AbortError'
        if (aborted) {
          updateTurn(turnId, {
            isStreaming: false,
            phase: SearchExecutionPhase.STOPPED,
            latencyMs: Date.now() - startedAt,
          })
          setPhase(SearchExecutionPhase.STOPPED)
          return
        }

        updateTurn(turnId, {
          isStreaming: false,
          phase: SearchExecutionPhase.ERROR,
          latencyMs: Date.now() - startedAt,
          errorMessage:
            error instanceof Error && error.message
              ? error.message
              : '搜索执行失败，请稍后重试。',
        })
        setPhase(SearchExecutionPhase.ERROR)
      }
    },
    [
      appliedConfig,
      ensureRerankModelMap,
      flushPendingStreamPatch,
      resetPendingStreamPatch,
      scheduleStreamPatch,
      searchApp,
      updateTurn,
    ],
  )

  const stop = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    resetPendingStreamPatch()

    setTurns((prev) =>
      prev.map((turn) =>
        turn.isStreaming
          ? { ...turn, isStreaming: false, phase: SearchExecutionPhase.STOPPED }
          : turn,
      ),
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
