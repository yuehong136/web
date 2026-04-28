import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { agentAPI } from '@/api/agent'
import {
  useCancelConversation,
  useCreateAgentSession,
  useFetchAgent,
  useFetchAgentSession,
} from '@/hooks/use-agent-request'
import { toast } from '@/lib/toast'
import type { BeginQuery } from '../../types'
import {
  AgentRuntimeStatus,
  type RuntimeMessage,
} from '../../features/runtime-workbench/types'
import {
  buildRuntimeInputObject,
  formatRuntimeInputSummary,
} from '../../features/runtime-workbench/utils'
import {
  consumeRuntimeStream,
  createLocalRuntimeMessageId,
} from '../../features/runtime-workbench/runtime-stream'
import {
  buildExploreSessionName,
  getBeginInputsFromAgent,
  isExploreTaskMode,
  mapSessionMessagesToRuntimeMessages,
} from '../utils'
import type { ExploreSendRequest } from '../types'
import { useExploreRuntimeEvents } from './use-explore-runtime-events'

export function useExploreSessionChat({
  canvasId,
  sessionId,
  isNew,
  onSessionReady,
}: {
  canvasId: string
  sessionId: string
  isNew: boolean
  onSessionReady: (sessionId: string) => void
}) {
  const agentQuery = useFetchAgent(canvasId)
  const sessionQuery = useFetchAgentSession(canvasId, sessionId)
  const { createAgentSession } = useCreateAgentSession(canvasId)
  const { cancelConversation } = useCancelConversation()

  const beginInputs = useMemo(
    () => getBeginInputsFromAgent(agentQuery.data),
    [agentQuery.data],
  )
  const isTaskMode = useMemo(
    () => isExploreTaskMode(agentQuery.data),
    [agentQuery.data],
  )

  const [messages, setMessages] = useState<RuntimeMessage[]>([])
  const [status, setStatus] = useState<AgentRuntimeStatus>(AgentRuntimeStatus.IDLE)
  const [lastError, setLastError] = useState<string>()
  const [currentMessageId, setCurrentMessageId] = useState<string>()
  const [latestTaskId, setLatestTaskId] = useState<string>()
  const [parameterDialogOpen, setParameterDialogOpen] = useState(false)
  const [submittedBeginInputs, setSubmittedBeginInputs] = useState<BeginQuery[] | null>(null)
  const [pendingRequest, setPendingRequest] = useState<ExploreSendRequest | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const sessionIdRef = useRef(sessionId)
  const streamingSessionIdRef = useRef('')
  const hasLocalMessageRef = useRef(false)

  useEffect(() => {
    sessionIdRef.current = sessionId
  }, [sessionId])

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

  const { handleNormalizedEvent, resetRuntimeEventState } = useExploreRuntimeEvents({
    sessionIdRef,
    onSessionReady,
    setCurrentMessageId,
    setLatestTaskId,
    setLastError,
    setStatus,
    updateMessageById,
  })

  useEffect(() => {
    if (streamingSessionIdRef.current && sessionId === streamingSessionIdRef.current) {
      return
    }

    abortControllerRef.current?.abort()
    resetRuntimeEventState()
    hasLocalMessageRef.current = false
    setLastError(undefined)
    setStatus(AgentRuntimeStatus.IDLE)
    setSubmittedBeginInputs(null)
    setPendingRequest(null)
    setParameterDialogOpen(false)

    if (isNew || !sessionId) {
      setMessages([])
    }
  }, [isNew, resetRuntimeEventState, sessionId])

  useEffect(() => {
    if (hasLocalMessageRef.current) {
      return
    }

    if (isNew || !sessionId) {
      return
    }

    if (sessionQuery.data?.id === sessionId) {
      setMessages(mapSessionMessagesToRuntimeMessages(sessionQuery.data))
    }
  }, [isNew, sessionId, sessionQuery.data])

  const runRequest = useCallback(
    async ({
      content = '',
      files = [],
      runtimeInputs,
      appendUserMessage,
      userMessageContent,
    }: ExploreSendRequest & {
      runtimeInputs: Record<string, unknown>
      appendUserMessage: boolean
      userMessageContent?: string
    }) => {
      if (!canvasId) {
        toast.error('缺少画布 ID，无法发送消息')
        return
      }

      let activeSessionId = sessionIdRef.current
      if (!activeSessionId) {
        const session = await createAgentSession(buildExploreSessionName(content))
        activeSessionId = session.id
        sessionIdRef.current = session.id
        streamingSessionIdRef.current = session.id
        onSessionReady(session.id)
      } else {
        streamingSessionIdRef.current = activeSessionId
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

      hasLocalMessageRef.current = true
      const assistantId = appendAssistantPlaceholder()
      const abortController = new AbortController()
      abortControllerRef.current = abortController
      setStatus(AgentRuntimeStatus.RUNNING)
      setLastError(undefined)

      try {
        const response = await agentAPI.runAgentSession(
          {
            id: canvasId,
            query: content,
            session_id: activeSessionId,
            files,
            inputs: runtimeInputs,
          },
          {
            signal: abortController.signal,
          },
        )

        await consumeRuntimeStream(response, (event) => {
          handleNormalizedEvent(assistantId, event)
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
        void sessionQuery.refetch()
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
        streamingSessionIdRef.current = ''
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null
        }
      }
    },
    [
      appendAssistantPlaceholder,
      canvasId,
      createAgentSession,
      handleNormalizedEvent,
      onSessionReady,
      sessionQuery,
      updateMessageById,
    ],
  )

  const submitSendRequest = useCallback(
    async (request: ExploreSendRequest, beginValues: BeginQuery[] | null) => {
      const content = request.content?.trim() || ''
      const files = request.files || []
      if (!isTaskMode && !content && files.length === 0) {
        return
      }

      await runRequest({
        content,
        files,
        runtimeInputs: buildRuntimeInputObject(beginValues || beginInputs),
        appendUserMessage: Boolean(content || files.length > 0),
      })
    },
    [beginInputs, isTaskMode, runRequest],
  )

  const handleSendMessage = useCallback(
    async (request: ExploreSendRequest) => {
      if (status === AgentRuntimeStatus.RUNNING) {
        return
      }

      if (beginInputs.length > 0 && submittedBeginInputs === null) {
        setPendingRequest(request)
        setParameterDialogOpen(true)
        return
      }

      await submitSendRequest(request, submittedBeginInputs)
    },
    [beginInputs.length, status, submitSendRequest, submittedBeginInputs],
  )

  const handleParametersOk = useCallback(
    async (values: BeginQuery[]) => {
      setSubmittedBeginInputs(values)
      setParameterDialogOpen(false)
      const request = pendingRequest || { content: '' }
      setPendingRequest(null)
      await submitSendRequest(request, values)
    },
    [pendingRequest, submitSendRequest],
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
    if (latestTaskId) {
      try {
        await cancelConversation(latestTaskId)
      } catch {
        // local abort state is handled in the stream catch path
      }
    }
  }, [cancelConversation, latestTaskId])

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  return {
    agent: agentQuery.data,
    session: sessionQuery.data,
    sessionQuery,
    beginInputs,
    isTaskMode,
    messages,
    status,
    loading: status === AgentRuntimeStatus.RUNNING,
    lastError,
    currentMessageId,
    latestTaskId,
    parameterDialogOpen,
    setParameterDialogOpen,
    handleParametersOk,
    handleSendMessage,
    handleSubmitAwaitingInputs,
    handleStop,
  }
}
