import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useCreateAgentSession,
  useFetchAgent,
  useFetchAgentSessions,
} from '@/hooks/use-agent-request'
import { resolveLocalizedText } from '@/lib/agent'
import { toast } from '@/lib/toast'
import { BeginId } from '../../../constant'
import { useCacheChatLog } from '../../../hooks/use-cache-chat-log'
import {
  useGetBeginNodeDataInputs,
  useIsTaskMode,
} from '../../../hooks/use-get-begin-query'
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
import { shouldStoreRuntimeThoughtEvent } from '../thought-chain-utils'
import {
  consumeRuntimeStream,
  createLocalRuntimeMessageId,
} from '../runtime-stream'
import {
  buildA2UIActionInput,
  mergeSurfaceIds,
  type AgentXCardActionPayload,
} from '../../../x-card'
interface UseAgentRuntimeWorkbenchOptions {
  canvasId?: string
  currentView: RuntimeWorkbenchView
  onViewChange: (view: RuntimeWorkbenchView) => void
  onSummaryChange?: (summary: ReturnType<typeof buildRuntimeSummary>) => void
}
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null
export function useAgentRuntimeWorkbench({
  canvasId,
  currentView,
  onViewChange,
  onSummaryChange,
}: UseAgentRuntimeWorkbenchOptions): AgentRuntimeController {
  const { t } = useTranslation()
  const getNode = useGraphStore((state) => state.getNode)
  const updateNodeForm = useGraphStore((state) => state.updateNodeForm)
  const beginInputs = useGetBeginNodeDataInputs()
  const isTaskMode = useIsTaskMode()
  const { agent } = useFetchAgent(canvasId)
  const sessionsQuery = useFetchAgentSessions(canvasId)
  const { createAgentSession } = useCreateAgentSession(canvasId || '')
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
  const [viewingSessionId, setViewingSessionId] = useState<string>()

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

  const {
    startButNotFinishedNodeIds,
    successNodeIds,
    errorNodeIds,
    nodeElapsedMap,
  } = useNodeLoading({
    currentEventListWithoutMessageById,
    currentMessageId,
  })
  const lastNodeId = startButNotFinishedNodeIds[startButNotFinishedNodeIds.length - 1]

  const clearRuntimeState = useCallback((nextSessionId = sessionId) => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    messageStateRef.current = {}
    setMessages([])
    setSessionId(nextSessionId ?? null)
    clearEventList()
    setCurrentMessageId('')
    setLastError(undefined)
    setStatus(AgentRuntimeStatus.IDLE)
  }, [clearEventList, sessionId, setCurrentMessageId])

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

  const sessionName = useMemo(() => {
    if (!sessionId) {
      return undefined
    }

    return sessionsQuery.data.sessions.find((session) => session.id === sessionId)
      ?.name
  }, [sessionId, sessionsQuery.data.sessions])

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
    const assistantId = createLocalRuntimeMessageId('assistant')
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

      const logEvent = normalizedEvent.logEvent

      if (logEvent) {
        addEventList(
          [logEvent],
          logEvent.message_id,
        )

        if (
          shouldStoreRuntimeThoughtEvent(
            logEvent.event,
            logEvent.data,
          )
        ) {
          updateMessageById(assistantId, (message) => ({
            ...message,
            logEvents: [
              ...(message.logEvents || []),
              {
                event: logEvent.event,
                data: logEvent.data,
              },
            ],
            messageId: normalizedEvent.messageId || message.messageId,
            taskId: normalizedEvent.taskId || message.taskId,
          }))
        }
      }

      if (
        normalizedEvent.event === 'node_finished' &&
        normalizedEvent.outputContent
      ) {
        updateMessageById(assistantId, (message) => ({
          ...message,
          content: message.content || normalizedEvent.outputContent || '',
          messageId: normalizedEvent.messageId || message.messageId,
          taskId: normalizedEvent.taskId || message.taskId,
        }))
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

      if (normalizedEvent.event === 'a2ui_command') {
        updateMessageById(assistantId, (message) => ({
          ...message,
          content: message.content || '',
          xCardCommands: [
            ...(message.xCardCommands || []),
            ...(normalizedEvent.xCardCommands || []),
          ],
          xCardSurfaceIds: mergeSurfaceIds(
            message.xCardSurfaceIds,
            normalizedEvent.xCardSurfaceIds,
          ),
          xCardStatus: normalizedEvent.xCardStatus || message.xCardStatus,
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
        const outputContent = normalizedEvent.outputContent

        if (runtimeError) {
          setLastError(runtimeError)
          setStatus(AgentRuntimeStatus.ERROR)
        }

        updateMessageById(assistantId, (message) => ({
          ...message,
          files: normalizeRuntimeAttachments(outputs?.attachment),
          content: message.content || runtimeError || outputContent || '',
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
      a2ui,
      metadata,
      appendUserMessage,
      userMessageContent,
      skipSave = false,
    }: {
      content?: string
      files?: RuntimeAttachment[]
      runtimeInputs: Record<string, unknown>
      a2ui?: Array<Record<string, unknown>>
      metadata?: Record<string, unknown>
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
            id: createLocalRuntimeMessageId('user'),
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
            a2ui,
            metadata,
          },
          {
            signal: abortController.signal,
          },
        )

        await consumeRuntimeStream(response, (parsedEvent) => {
          handleNormalizedEvent(assistantId, parsedEvent)
        })

        setStatus((current) =>
          current === AgentRuntimeStatus.ERROR
            ? current
            : AgentRuntimeStatus.SUCCESS,
        )
        updateMessageById(assistantId, (message) => ({
          ...message,
          isStreaming: false,
        }))
        void sessionsQuery.refetch()
      } catch (error) {
        const isAbortError =
          error instanceof DOMException && error.name === 'AbortError'
        const errorMessage = t(
          isAbortError ? 'agent.runtime.runStopped' : 'agent.runtime.runFailed',
        )

        setLastError(errorMessage)
        setStatus(
          isAbortError ? AgentRuntimeStatus.STOPPED : AgentRuntimeStatus.ERROR,
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
        void sessionsQuery.refetch()
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
      sessionsQuery,
      sessionId,
      t,
      updateMessageById,
    ],
  )

  const handleRun = useCallback(
    async (values: BeginQuery[]) => {
      const beginNode = getNode(BeginId)
      const currentInputs = beginNode?.data?.form?.inputs || {}
      const nextInputs = buildBeginQueryWithObject(currentInputs, values)

      clearRuntimeState(sessionId)
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
      sessionId,
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

  const handleXCardAction = useCallback(
    async (payload: AgentXCardActionPayload) => {
      if (status === AgentRuntimeStatus.RUNNING) {
        return
      }

      const actionInput = buildA2UIActionInput(payload)

      await runRequest({
        content: actionInput.query,
        runtimeInputs: buildRuntimeInputObject(beginInputs),
        a2ui: actionInput.a2ui,
        metadata: actionInput.metadata,
        appendUserMessage: true,
        userMessageContent: actionInput.query,
        skipSave: true,
      })
    },
    [beginInputs, runRequest, status],
  )

  const handleStop = useCallback(async () => {
    abortControllerRef.current?.abort()
    await stopMessage(latestTaskId)
  }, [latestTaskId, stopMessage])

  const handleReset = useCallback(() => {
    clearRuntimeState(sessionId)
  }, [clearRuntimeState, sessionId])

  const handleCreateSession = useCallback(
    async (name?: string) => {
      if (!canvasId) {
        toast.error('缺少画布 ID，无法创建会话')
        return
      }

      try {
        const session = await createAgentSession(name || '新会话')
        clearRuntimeState(session.id)
        setViewingSessionId(undefined)
        onViewChange(RuntimeWorkbenchView.CONVERSATION)
        toast.success('已创建新会话')
      } catch {
        toast.error(t('agent.runtime.createSessionFailed'))
      }
    },
    [canvasId, clearRuntimeState, createAgentSession, onViewChange, t],
  )

  const handleSwitchViewingSession = useCallback((id: string | undefined) => {
    setViewingSessionId(id)
  }, [])

  const handleAdoptViewingSession = useCallback(() => {
    if (!viewingSessionId) {
      return
    }

    clearRuntimeState(viewingSessionId)
    setViewingSessionId(undefined)
    onViewChange(RuntimeWorkbenchView.CONVERSATION)
  }, [clearRuntimeState, onViewChange, viewingSessionId])

  const summary = useMemo(
    () =>
      buildRuntimeSummary({
        status,
        currentView,
        messageCount: messages.length,
        hasLogs: logEvents.length > 0,
        sessionId: sessionId || undefined,
        sessionName,
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
      sessionId,
      sessionName,
      status,
    ],
  )

  useEffect(() => {
    onSummaryChange?.(summary)
  }, [onSummaryChange, summary])

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
    sessionId: sessionId || undefined,
    viewingSessionId,
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
    successNodeIds,
    errorNodeIds,
    nodeElapsedMap,
    lastError,
    handleRun,
    handleSendMessage,
    handleSubmitAwaitingInputs,
    handleXCardAction,
    handleStop,
    handleReset,
    handleCreateSession,
    handleSwitchViewingSession,
    handleAdoptViewingSession,
  }
}
