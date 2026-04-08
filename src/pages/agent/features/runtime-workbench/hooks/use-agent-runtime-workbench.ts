import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { EventSourceParserStream } from 'eventsource-parser/stream'
import { useFetchAgent } from '@/hooks/use-agent-request'
import { resolveLocalizedText } from '@/lib/agent'
import { toast } from '@/lib/toast'
import { BeginId } from '../../../constant'
import { useCacheChatLog } from '../../../hooks/use-cache-chat-log'
import { useGetBeginNodeDataInputs, useIsTaskMode } from '../../../hooks/use-get-begin-query'
import { useNodeLoading } from '../../../hooks/use-node-loading'
import { useSaveGraph } from '../../../hooks/use-save-graph'
import { useStopMessage } from '../../../hooks/use-stop-message'
import useGraphStore from '../../../store'
import { buildBeginQueryWithObject } from '../../../utils'
import type { BeginQuery } from '../../../types'
import { agentAPI } from '@/api/agent'
import {
  AgentRuntimeStatus,
  RuntimeWorkbenchView,
  type AgentRuntimeController,
  type RuntimeAttachment,
  type RuntimeMessage,
} from '../types'
import {
  buildRuntimeInputObject,
  buildRuntimeSummary,
  consumeRuntimeMessageChunk,
  formatRuntimeInputSummary,
  normalizeRuntimeAttachments,
  normalizeRuntimeAwaitingInputs,
  normalizeRuntimeEvent,
} from '../utils'

interface UseAgentRuntimeWorkbenchOptions {
  canvasId?: string
  currentView: RuntimeWorkbenchView
  onViewChange: (view: RuntimeWorkbenchView) => void
  onSummaryChange?: (summary: ReturnType<typeof buildRuntimeSummary>) => void
}

const createLocalMessageId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

export function useAgentRuntimeWorkbench({
  canvasId,
  currentView,
  onViewChange,
  onSummaryChange,
}: UseAgentRuntimeWorkbenchOptions): AgentRuntimeController {
  const getNode = useGraphStore((state) => state.getNode)
  const updateNodeForm = useGraphStore((state) => state.updateNodeForm)
  const beginInputs = useGetBeginNodeDataInputs()
  const isTaskMode = useIsTaskMode()
  const { agent } = useFetchAgent(canvasId)
  const { saveGraph, loading: saving } = useSaveGraph(canvasId, false)
  const { stopMessage } = useStopMessage()
  const {
    addEventList,
    clearEventList,
    currentEventListWithoutMessageById,
    currentMessageId,
    latestTaskId,
    setCurrentMessageId,
  } = useCacheChatLog()

  const [messages, setMessages] = useState<RuntimeMessage[]>([])
  const [status, setStatus] = useState<AgentRuntimeStatus>(
    AgentRuntimeStatus.IDLE,
  )
  const [lastRunAt, setLastRunAt] = useState<number>()
  const [lastError, setLastError] = useState<string>()
  const [sessionId, setSessionId] = useState<string | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const messageStateRef = useRef<Record<string, ReturnType<typeof consumeRuntimeMessageChunk>['nextState']>>({})
  const latestTaskIdRef = useRef(latestTaskId)

  useEffect(() => {
    latestTaskIdRef.current = latestTaskId
  }, [latestTaskId])

  const logEvents = useMemo(() => {
    if (!currentMessageId) {
      return []
    }
    return currentEventListWithoutMessageById(currentMessageId)
  }, [currentEventListWithoutMessageById, currentMessageId])

  const { startButNotFinishedNodeIds } = useNodeLoading({
    currentEventListWithoutMessageById,
    currentMessageId,
  })
  const lastNodeId = startButNotFinishedNodeIds[startButNotFinishedNodeIds.length - 1]

  const clearRuntimeState = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    messageStateRef.current = {}
    setMessages([])
    setSessionId(null)
    clearEventList()
    setCurrentMessageId('')
    setLastError(undefined)
    setStatus(AgentRuntimeStatus.IDLE)
  }, [clearEventList, setCurrentMessageId])

  const updateMessageById = useCallback(
    (
      messageId: string,
      updater: (message: RuntimeMessage) => RuntimeMessage,
    ) => {
      setMessages((previous) =>
        previous.map((message) =>
          message.id === messageId ? updater(message) : message,
        ),
      )
    },
    [],
  )

  const resolveCanvasTitle = useMemo(() => {
    return resolveLocalizedText(agent?.title, '未命名资产')
  }, [agent?.title])

  const saveCurrentGraph = useCallback(async () => {
    if (!canvasId) {
      toast.error('缺少画布 ID，无法保存当前运行上下文')
      return false
    }

    const saved = await saveGraph(resolveCanvasTitle)

    if (!saved) {
      toast.error('保存失败，无法进入运行工作台')
      return false
    }

    return true
  }, [canvasId, resolveCanvasTitle, saveGraph])

  const appendAssistantPlaceholder = useCallback(() => {
    const assistantId = createLocalMessageId('assistant')
    setMessages((previous) => [
      ...previous,
      {
        id: assistantId,
        role: 'assistant',
        content: '',
        thinking: '',
        files: [],
        isStreaming: true,
      },
    ])

    return assistantId
  }, [])

  const handleNormalizedEvent = useCallback(
    (assistantId: string, rawEvent: unknown) => {
      const normalizedEvent = normalizeRuntimeEvent(rawEvent)

      if (normalizedEvent.sessionId) {
        setSessionId(normalizedEvent.sessionId)
      }

      if (normalizedEvent.messageId) {
        setCurrentMessageId(normalizedEvent.messageId)
      }

      if (normalizedEvent.logEvent) {
        addEventList(
          [normalizedEvent.logEvent],
          normalizedEvent.logEvent.message_id,
        )
      }

      if (normalizedEvent.errorMessage) {
        setLastError(normalizedEvent.errorMessage)
        setStatus(AgentRuntimeStatus.ERROR)
        updateMessageById(assistantId, (message) => ({
          ...message,
          content: message.content || normalizedEvent.errorMessage || '',
          error: normalizedEvent.errorMessage,
          isStreaming: false,
          messageId: normalizedEvent.messageId || message.messageId,
          taskId: normalizedEvent.taskId || message.taskId,
        }))
        return
      }

      if (normalizedEvent.event === 'message') {
        const previousState = messageStateRef.current[assistantId]
        const nextChunk = consumeRuntimeMessageChunk(
          previousState,
          normalizedEvent.data,
        )
        messageStateRef.current[assistantId] = nextChunk.nextState

        updateMessageById(assistantId, (message) => ({
          ...message,
          content: nextChunk.nextState.content,
          thinking: nextChunk.nextState.thinking,
          isStreaming: true,
          messageId: normalizedEvent.messageId || message.messageId,
          taskId: normalizedEvent.taskId || message.taskId,
        }))
        return
      }

      if (normalizedEvent.event === 'message_end') {
        const reference =
          isRecord(normalizedEvent.data) &&
          'reference' in normalizedEvent.data
            ? normalizedEvent.data.reference
            : undefined

        updateMessageById(assistantId, (message) => ({
          ...message,
          reference: reference ?? message.reference,
          isStreaming: false,
          messageId: normalizedEvent.messageId || message.messageId,
          taskId: normalizedEvent.taskId || message.taskId,
        }))
        return
      }

      if (normalizedEvent.event === 'workflow_finished') {
        const outputs =
          isRecord(normalizedEvent.data) && isRecord(normalizedEvent.data.outputs)
            ? normalizedEvent.data.outputs
            : undefined

        const runtimeError =
          typeof outputs?._ERROR === 'string' ? outputs._ERROR : undefined

        if (runtimeError) {
          setLastError(runtimeError)
          setStatus(AgentRuntimeStatus.ERROR)
        }

        updateMessageById(assistantId, (message) => ({
          ...message,
          files: normalizeRuntimeAttachments(outputs?.attachment),
          content: message.content || runtimeError || '',
          error: runtimeError ?? message.error,
          isStreaming: false,
          messageId: normalizedEvent.messageId || message.messageId,
          taskId: normalizedEvent.taskId || message.taskId,
        }))
        return
      }

      if (normalizedEvent.event === 'user_inputs') {
        const payload = isRecord(normalizedEvent.data) ? normalizedEvent.data : {}

        updateMessageById(assistantId, (message) => ({
          ...message,
          tips:
            typeof payload.tips === 'string' ? payload.tips : message.tips,
          awaitingInputs: normalizeRuntimeAwaitingInputs(payload.inputs),
          isStreaming: false,
          messageId: normalizedEvent.messageId || message.messageId,
          taskId: normalizedEvent.taskId || message.taskId,
        }))
      }
    },
    [addEventList, setCurrentMessageId, updateMessageById],
  )

  const runRequest = useCallback(
    async ({
      content = '',
      files = [],
      runtimeInputs,
      appendUserMessage,
      userMessageContent,
      skipSave = false,
    }: {
      content?: string
      files?: RuntimeAttachment[]
      runtimeInputs: Record<string, unknown>
      appendUserMessage: boolean
      userMessageContent?: string
      skipSave?: boolean
    }) => {
      if (!canvasId) {
        toast.error('缺少画布 ID，无法运行当前 Agent')
        return
      }

      if (!skipSave) {
        setStatus(AgentRuntimeStatus.PREPARING)
        const saved = await saveCurrentGraph()
        if (!saved) {
          setStatus(AgentRuntimeStatus.ERROR)
          return
        }
      }

      if (appendUserMessage) {
        setMessages((previous) => [
          ...previous,
          {
            id: createLocalMessageId('user'),
            role: 'user',
            content: userMessageContent || content.trim(),
            files,
          },
        ])
      }

      const assistantId = appendAssistantPlaceholder()
      onViewChange(RuntimeWorkbenchView.CONVERSATION)
      setLastRunAt(Date.now())
      setLastError(undefined)
      setStatus(AgentRuntimeStatus.RUNNING)

      const abortController = new AbortController()
      abortControllerRef.current = abortController

      try {
        const response = await agentAPI.runAgent(
          {
            id: canvasId,
            query: content,
            session_id: sessionId,
            files,
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
              errorBody?.message ||
              errorBody?.retmsg ||
              errorMessage
          } catch {
            // ignore json parsing errors for non-json error bodies
          }

          throw new Error(errorMessage)
        }

        if (!response.body) {
          throw new Error('运行接口没有返回可读的数据流')
        }

        const reader = response.body
          .pipeThrough(new TextDecoderStream())
          .pipeThrough(new EventSourceParserStream())
          .getReader()

        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            break
          }

          const rawData = value?.data
          if (!rawData) {
            continue
          }

          try {
            const parsedEvent = JSON.parse(rawData)
            handleNormalizedEvent(assistantId, parsedEvent)
          } catch {
            // ignore malformed chunks
          }
        }

        setStatus((current) =>
          current === AgentRuntimeStatus.ERROR
            ? current
            : AgentRuntimeStatus.SUCCESS,
        )
        updateMessageById(assistantId, (message) => ({
          ...message,
          isStreaming: false,
        }))
      } catch (error) {
        const isAbortError =
          error instanceof DOMException && error.name === 'AbortError'
        const errorMessage = isAbortError
          ? '已停止当前运行'
          : error instanceof Error
            ? error.message
            : '运行失败'

        setLastError(errorMessage)
        setStatus(
          isAbortError
            ? AgentRuntimeStatus.STOPPED
            : AgentRuntimeStatus.ERROR,
        )
        updateMessageById(assistantId, (message) => ({
          ...message,
          content: message.content || errorMessage,
          error: errorMessage,
          isStreaming: false,
        }))

        if (!isAbortError) {
          toast.error(errorMessage)
        }
      } finally {
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null
        }
      }
    },
    [
      appendAssistantPlaceholder,
      canvasId,
      handleNormalizedEvent,
      onViewChange,
      saveCurrentGraph,
      sessionId,
      updateMessageById,
    ],
  )

  const handleRun = useCallback(
    async (values: BeginQuery[]) => {
      const beginNode = getNode(BeginId)
      const currentInputs = beginNode?.data?.form?.inputs || {}
      const nextInputs = buildBeginQueryWithObject(currentInputs, values)

      clearRuntimeState()
      updateNodeForm(BeginId, nextInputs, ['inputs'])

      if (isTaskMode) {
        await runRequest({
          content: '',
          runtimeInputs: nextInputs,
          appendUserMessage: false,
          skipSave: false,
        })
        return
      }

      setStatus(AgentRuntimeStatus.PREPARING)
      const saved = await saveCurrentGraph()
      if (!saved) {
        setStatus(AgentRuntimeStatus.ERROR)
        return
      }

      setStatus(AgentRuntimeStatus.IDLE)
      onViewChange(RuntimeWorkbenchView.CONVERSATION)
      toast.success('运行参数已同步，开始输入测试消息')
    },
    [
      clearRuntimeState,
      getNode,
      isTaskMode,
      onViewChange,
      runRequest,
      saveCurrentGraph,
      updateNodeForm,
    ],
  )

  const handleSendMessage = useCallback(
    async ({ content = '', files = [] }: { content?: string; files?: RuntimeAttachment[] }) => {
      if (!content.trim() && files.length === 0) {
        return
      }

      await runRequest({
        content: content.trim(),
        files,
        runtimeInputs: buildRuntimeInputObject(beginInputs),
        appendUserMessage: true,
      })
    },
    [beginInputs, runRequest],
  )

  const handleSubmitAwaitingInputs = useCallback(
    async (messageId: string, values: BeginQuery[]) => {
      updateMessageById(messageId, (message) => ({
        ...message,
        awaitingInputs: undefined,
      }))

      await runRequest({
        content: '',
        runtimeInputs: buildRuntimeInputObject(values),
        appendUserMessage: true,
        userMessageContent: formatRuntimeInputSummary(values),
      })
    },
    [runRequest, updateMessageById],
  )

  const handleStop = useCallback(async () => {
    abortControllerRef.current?.abort()
    await stopMessage(latestTaskId)
  }, [latestTaskId, stopMessage])

  const summary = useMemo(
    () =>
      buildRuntimeSummary({
        status,
        currentView,
        messageCount: messages.length,
        hasLogs: logEvents.length > 0,
        lastRunAt,
        lastMessageId: currentMessageId || undefined,
        lastTaskId: latestTaskId || undefined,
        lastError,
      }),
    [
      currentMessageId,
      currentView,
      lastError,
      lastRunAt,
      latestTaskId,
      logEvents.length,
      messages.length,
      status,
    ],
  )

  useEffect(() => {
    onSummaryChange?.(summary)
  }, [onSummaryChange, summary])

  useEffect(() => {
    if (
      status === AgentRuntimeStatus.RUNNING &&
      startButNotFinishedNodeIds.length === 0 &&
      currentMessageId
    ) {
      setStatus(AgentRuntimeStatus.SUCCESS)
    }
  }, [currentMessageId, startButNotFinishedNodeIds.length, status])

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
      if (latestTaskIdRef.current) {
        void stopMessage(latestTaskIdRef.current)
      }
    }
  }, [stopMessage])

  return {
    canvasId,
    beginInputs,
    isTaskMode,
    messages,
    logEvents,
    summary,
    currentMessageId,
    latestTaskId,
    status,
    loading:
      status === AgentRuntimeStatus.RUNNING ||
      status === AgentRuntimeStatus.PREPARING,
    saving,
    hasMessages: messages.length > 0,
    hasLogs: logEvents.length > 0,
    lastNodeId,
    startButNotFinishedNodeIds,
    lastError,
    handleRun,
    handleSendMessage,
    handleSubmitAwaitingInputs,
    handleStop,
    handleReset: clearRuntimeState,
  }
}
