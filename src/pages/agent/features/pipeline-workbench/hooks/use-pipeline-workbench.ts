import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { agentAPI } from '@/api/agent'
import {
  useCancelDataflow,
  useFetchAgent,
} from '@/hooks/use-agent-request'
import { resolveLocalizedText } from '@/lib/agent'
import { toast } from '@/lib/toast'
import type { AgentTraceItem } from '@/types/agent'
import { adaptAgentTraceItems } from '../../../adapters'
import { BeginId, Operator } from '../../../constant'
import { useGetBeginNodeDataInputs } from '../../../hooks/use-get-begin-query'
import { useSaveGraph } from '../../../hooks/use-save-graph'
import useGraphStore from '../../../store'
import type { BeginQuery } from '../../../types'
import { buildBeginQueryWithObject } from '../../../utils'
import {
  PipelineRuntimeStatus,
  PipelineWorkbenchView,
  type PipelineRuntimeController,
} from '../types'
import {
  buildPipelineResultPath,
  buildPipelineInputObject,
  buildPipelineSummary,
  downloadJsonFile,
  extractMessageIdFromChunk,
  findFirstPipelineRunFile,
  findLastFailureMessage,
  findPipelineEndOutput,
  isPipelineCompleted,
  isPipelineEndOutputEmpty,
} from '../utils'

const PIPELINE_TRACE_INTERVAL = 2000

interface UsePipelineWorkbenchOptions {
  canvasId?: string
  currentView: PipelineWorkbenchView
  onViewChange: (view: PipelineWorkbenchView) => void
  onSummaryChange?: (
    summary: PipelineRuntimeController['summary'],
  ) => void
}

export function usePipelineWorkbench({
  canvasId,
  currentView,
  onViewChange,
  onSummaryChange,
}: UsePipelineWorkbenchOptions): PipelineRuntimeController {
  const navigate = useNavigate()
  const getNode = useGraphStore((state) => state.getNode)
  const findNodeByName = useGraphStore((state) => state.findNodeByName)
  const updateNodeForm = useGraphStore((state) => state.updateNodeForm)
  const beginInputs = useGetBeginNodeDataInputs()
  const { agent } = useFetchAgent(canvasId)
  const { saveGraph, loading: saving } = useSaveGraph(canvasId, false)
  const { cancelDataflow, isLoading: cancelling } = useCancelDataflow()

  const [status, setStatus] = useState<PipelineRuntimeStatus>(
    PipelineRuntimeStatus.IDLE,
  )
  const [messageId, setMessageId] = useState<string>('')
  const [lastRunAt, setLastRunAt] = useState<number>()
  const [lastError, setLastError] = useState<string>()
  const [lastTaskId, setLastTaskId] = useState<string>()
  const [uploadedFile, setUploadedFile] = useState<
    PipelineRuntimeController['uploadedFile']
  >()
  const abortControllerRef = useRef<AbortController | null>(null)

  const traceQuery = useQuery<AgentTraceItem[]>({
    queryKey: ['pipeline-trace', canvasId, messageId],
    enabled: Boolean(canvasId && messageId),
    queryFn: async () =>
      adaptAgentTraceItems(
        await agentAPI.fetchTrace(canvasId || '', messageId),
      ),
    refetchInterval: () =>
      status === PipelineRuntimeStatus.RUNNING ? PIPELINE_TRACE_INTERVAL : false,
    gcTime: 0,
    initialData: [],
  })

  const trace = useMemo(
    () => traceQuery.data || [],
    [traceQuery.data],
  )
  const completed = useMemo(() => isPipelineCompleted(trace), [trace])
  const endOutput = useMemo(() => findPipelineEndOutput(trace), [trace])
  const outputAvailable = useMemo(
    () => completed && !isPipelineEndOutputEmpty(trace),
    [completed, trace],
  )

  useEffect(() => {
    if (status !== PipelineRuntimeStatus.RUNNING) {
      return
    }

    if (completed) {
      setStatus(PipelineRuntimeStatus.SUCCESS)
      return
    }

    const failure = findLastFailureMessage(trace)
    if (failure) {
      setLastError(failure)
      setStatus(PipelineRuntimeStatus.ERROR)
    }
  }, [completed, status, trace])

  const resolveCanvasTitle = useMemo(
    () => resolveLocalizedText(agent?.title, '未命名资产'),
    [agent?.title],
  )
  const resultPath = useMemo(
    () =>
      buildPipelineResultPath({
        agentId: canvasId,
        agentTitle: resolveCanvasTitle,
        messageId,
        file: uploadedFile,
      }),
    [canvasId, messageId, resolveCanvasTitle, uploadedFile],
  )

  const saveCurrentGraph = useCallback(async () => {
    if (!canvasId) {
      toast.error('缺少画布 ID，无法保存当前 Pipeline 上下文')
      return false
    }

    const saved = await saveGraph(resolveCanvasTitle)
    if (!saved) {
      toast.error('保存失败，无法启动 Pipeline')
      return false
    }
    return true
  }, [canvasId, resolveCanvasTitle, saveGraph])

  const clearPipelineState = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setMessageId('')
    setLastTaskId(undefined)
    setLastError(undefined)
    setUploadedFile(undefined)
    setStatus(PipelineRuntimeStatus.IDLE)
  }, [])

  const handleRun = useCallback(
    async (values: BeginQuery[]) => {
      if (!canvasId) {
        toast.error('缺少画布 ID，无法运行 Pipeline')
        return
      }

      if (!findNodeByName(Operator.Tokenizer)) {
        const message = '请先添加 Tokenizer 节点，再启动 Pipeline'
        setLastError(message)
        setStatus(PipelineRuntimeStatus.ERROR)
        onViewChange(PipelineWorkbenchView.RUN)
        toast.warning(message)
        return
      }

      const beginNode = getNode(BeginId)
      const currentInputs = (beginNode?.data?.form?.inputs ||
        {}) as Record<string, BeginQuery>
      const nextInputs = buildBeginQueryWithObject(currentInputs, values)
      updateNodeForm(BeginId, nextInputs, ['inputs'])

      clearPipelineState()
      setStatus(PipelineRuntimeStatus.PREPARING)

      const saved = await saveCurrentGraph()
      if (!saved) {
        setStatus(PipelineRuntimeStatus.ERROR)
        return
      }

      const runtimeInputs = buildPipelineInputObject(
        values as unknown as Array<Record<string, unknown> & { key?: string }>,
      )
      const primaryFile = findFirstPipelineRunFile(
        values as unknown as Array<Record<string, unknown> & { key?: string }>,
      )
      const filesPayload = values
        .filter((item) => Array.isArray(item?.value as unknown))
        .flatMap((item) => (item.value as unknown as unknown[]) || [])

      setUploadedFile(primaryFile)
      setStatus(PipelineRuntimeStatus.RUNNING)
      setLastRunAt(Date.now())

      const abortController = new AbortController()
      abortControllerRef.current = abortController

      try {
        const response = await agentAPI.runAgent(
          {
            id: canvasId,
            query: '',
            session_id: null,
            files: filesPayload,
            inputs: runtimeInputs,
          },
          {
            signal: abortController.signal,
          },
        )

        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`
          try {
            const errorBody = await response.clone().json()
            errorMessage =
              errorBody?.message || errorBody?.retmsg || errorMessage
          } catch {
            // ignore non-json error bodies
          }
          throw new Error(errorMessage)
        }

        if (!response.body) {
          throw new Error('Pipeline 运行接口没有返回可读的数据流')
        }

        const reader = response.body
          .pipeThrough(new TextDecoderStream())
          .getReader()

        let buffer = ''
        let resolvedMessageId: string | undefined

        while (!resolvedMessageId) {
          const { done, value } = await reader.read()
          if (done) {
            break
          }

          buffer += value || ''

          for (const line of buffer.split(/\r?\n/)) {
            const trimmed = line.trim()
            if (!trimmed) continue
            const payload = trimmed.startsWith('data:')
              ? trimmed.slice(5).trim()
              : trimmed
            const candidate = extractMessageIdFromChunk(payload)
            if (candidate) {
              resolvedMessageId = candidate
              break
            }
          }
        }

        if (resolvedMessageId) {
          setMessageId(resolvedMessageId)
          setLastTaskId(resolvedMessageId)
          onViewChange(PipelineWorkbenchView.LOG)
        } else {
          throw new Error('未从 Pipeline 接口拿到 message_id')
        }
      } catch (error) {
        const isAbort =
          error instanceof DOMException && error.name === 'AbortError'
        const errorMessage = isAbort
          ? '已停止当前 Pipeline 运行'
          : error instanceof Error
            ? error.message
            : 'Pipeline 启动失败'

        setLastError(errorMessage)
        setStatus(
          isAbort
            ? PipelineRuntimeStatus.STOPPED
            : PipelineRuntimeStatus.ERROR,
        )

        if (!isAbort) {
          toast.error(errorMessage)
        }
      } finally {
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null
        }
      }
    },
    [
      canvasId,
      clearPipelineState,
      findNodeByName,
      getNode,
      onViewChange,
      saveCurrentGraph,
      updateNodeForm,
    ],
  )

  const handleCancel = useCallback(async () => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null

    if (!messageId) {
      setStatus(PipelineRuntimeStatus.STOPPED)
      return
    }

    try {
      await cancelDataflow(messageId)
      setStatus(PipelineRuntimeStatus.STOPPED)
    } catch (error) {
      const message = error instanceof Error ? error.message : '取消 Pipeline 失败'
      setLastError(message)
      toast.error(message)
    }
  }, [cancelDataflow, messageId])

  const handleReset = useCallback(() => {
    clearPipelineState()
    setLastRunAt(undefined)
  }, [clearPipelineState])

  const handleDownloadOutput = useCallback(() => {
    const output = findPipelineEndOutput(trace)
    if (isPipelineEndOutputEmpty(trace) || output === undefined) {
      toast.error('当前 Pipeline 暂无可下载的输出')
      return
    }
    const filename = `${resolveCanvasTitle || 'pipeline-output'}.json`
    downloadJsonFile(output, filename)
  }, [resolveCanvasTitle, trace])

  const handleOpenResult = useCallback(() => {
    if (!outputAvailable) {
      toast.info('当前 Pipeline 还没有可查看的结果')
      return
    }

    if (!resultPath) {
      toast.info('已生成 END 输出，但缺少文件 doc_id，暂不能打开结果落地页')
      return
    }

    navigate(resultPath)
  }, [navigate, outputAvailable, resultPath])

  const summary = useMemo(
    () =>
      buildPipelineSummary({
        status,
        currentView,
        messageCount: trace.length,
        hasLogs: trace.length > 0,
        outputAvailable,
        lastRunAt,
        lastMessageId: messageId || undefined,
        lastTaskId,
        lastError,
        uploadedFile,
        resultPath,
      }),
    [
      currentView,
      lastError,
      lastRunAt,
      lastTaskId,
      messageId,
      outputAvailable,
      resultPath,
      status,
      trace.length,
      uploadedFile,
    ],
  )

  useEffect(() => {
    onSummaryChange?.(summary)
  }, [onSummaryChange, summary])

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  return {
    canvasId,
    beginInputs,
    status,
    loading:
      status === PipelineRuntimeStatus.RUNNING ||
      status === PipelineRuntimeStatus.PREPARING,
    saving,
    cancelling,
    hasLogs: trace.length > 0,
    outputAvailable,
    trace,
    endOutput,
    lastError,
    lastMessageId: messageId || undefined,
    lastTaskId,
    uploadedFile,
    resultPath,
    summary,
    handleRun,
    handleCancel,
    handleReset,
    handleDownloadOutput,
    handleOpenResult,
  }
}
