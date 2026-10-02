import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import {
  useCancelConversation,
  useCreateAgentSession,
  useFetchAgent,
  useFetchAgentSession,
} from '@/hooks/use-agent-request'
import { agentQueryKeys } from '@/hooks/use-agent-query'
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
  buildA2UIActionInput,
  type AgentXCardActionPayload,
} from '../../x-card'
import {
  getBeginInputsFromAgent,
  isExploreTaskMode,
  mapSessionMessagesToRuntimeMessages,
} from '../utils'
import type {
  ExploreRequestOwner,
  ExploreSelection,
  ExploreSendRequest,
  ExploreSessionView,
} from '../types'
import { useExploreRuntimeEvents } from './use-explore-runtime-events'
import { useExploreRequestOwner } from './use-explore-request-owner'
import { useExploreRunRequest } from './use-explore-run-request'
import { toast } from '@/lib/toast'
import { extractSessionStatus } from '../../adapters/session'

function initialView(selection: ExploreSelection): ExploreSessionView {
  return {
    selection,
    messages: [],
    status: AgentRuntimeStatus.IDLE,
    hasLocalMessages: false,
    parameterDialogOpen: false,
    submittedBeginInputs: null,
    pendingRequest: null,
  }
}

export function useExploreSessionChat({
  canvasId,
  sessionId,
  isNew,
  selectionRevision = 0,
  onSessionReady,
}: {
  canvasId: string
  sessionId: string
  isNew: boolean
  selectionRevision?: number
  onSessionReady: (sessionId: string) => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const agentQuery = useFetchAgent(canvasId)
  const sessionQuery = useFetchAgentSession(canvasId, isNew ? '' : sessionId)
  const { createAgentSession } = useCreateAgentSession(canvasId)
  const { cancelConversation } = useCancelConversation()
  const selection = useMemo(
    () => ({ canvasId, sessionId, isNew, revision: selectionRevision }),
    [canvasId, sessionId, isNew, selectionRevision],
  )
  const [view, setView] = useState(() => initialView(selection))
  const onSelectionChange = useCallback(
    (next: ExploreSelection, promoted: boolean) => {
      setView((previous) =>
        promoted ? { ...previous, selection: next } : initialView(next),
      )
    },
    [],
  )
  const owner = useExploreRequestOwner(selection, onSelectionChange)
  const { owns } = owner
  const visible =
    view.selection === selection || owner.isPromotion(selection)
      ? view
      : initialView(selection)
  const hasHistory = !isNew && sessionQuery.data?.id === sessionId
  const historyFailure =
    hasHistory && extractSessionStatus(sessionQuery.data) === 'error'
      ? t('agent.runtime.runFailed')
      : undefined
  const needsHistory = Boolean(!isNew && sessionId && !visible.hasLocalMessages)
  const sessionError = needsHistory && sessionQuery.isError
  const loadingSession =
    needsHistory && !sessionError && (sessionQuery.isLoading || !hasHistory)
  const canSend = Boolean(
    canvasId && (isNew || sessionId) && !sessionError && !loadingSession,
  )
  const messages =
    !visible.hasLocalMessages && hasHistory
      ? mapSessionMessagesToRuntimeMessages(sessionQuery.data, historyFailure)
      : visible.messages
  const beginInputs = useMemo(
    () => getBeginInputsFromAgent(agentQuery.data),
    [agentQuery.data],
  )
  const isTaskMode = useMemo(
    () => isExploreTaskMode(agentQuery.data),
    [agentQuery.data],
  )

  const seedHistory = useCallback(
    (previous: ExploreSessionView): ExploreSessionView => {
      if (previous.hasLocalMessages || !hasHistory) return previous
      return {
        ...previous,
        messages: mapSessionMessagesToRuntimeMessages(
          sessionQuery.data,
          historyFailure,
        ),
        ...(historyFailure
          ? { status: AgentRuntimeStatus.ERROR, lastError: historyFailure }
          : {}),
      }
    },
    [hasHistory, historyFailure, sessionQuery.data],
  )

  const updateRequest = useCallback(
    (
      request: ExploreRequestOwner,
      updater: (value: ExploreSessionView) => ExploreSessionView,
    ) => {
      if (!owns(request)) return
      setView((previous) =>
        // URL promotion can rebase queued updates from the same request.
        // The owner check also rejects obsolete A -> B -> A generations.
        owns(request)
          ? { ...updater(seedHistory(previous)), selection: request.selection }
          : previous,
      )
    },
    [owns, seedHistory],
  )
  const updateCurrentRequest = useCallback(
    (updater: (value: ExploreSessionView) => ExploreSessionView) => {
      const request = owner.active.current
      if (request) updateRequest(request, updater)
    },
    [owner.active, updateRequest],
  )
  const updateMessageById = useCallback(
    (
      messageId: string,
      updater: (message: RuntimeMessage) => RuntimeMessage,
    ) => {
      updateCurrentRequest((previous) => ({
        ...previous,
        messages: previous.messages.map((message) =>
          message.id === messageId ? updater(message) : message,
        ),
      }))
    },
    [updateCurrentRequest],
  )
  const setCurrentMessageId = useCallback(
    (id: string | undefined) =>
      updateCurrentRequest((previous) => ({
        ...previous,
        currentMessageId: id,
      })),
    [updateCurrentRequest],
  )
  const setLatestTaskId = useCallback(
    (id: string | undefined) =>
      updateCurrentRequest((previous) => ({ ...previous, latestTaskId: id })),
    [updateCurrentRequest],
  )
  const setLastError = useCallback(
    (error: string | undefined) =>
      updateCurrentRequest((previous) => ({ ...previous, lastError: error })),
    [updateCurrentRequest],
  )
  const setStatus = useCallback(
    (status: AgentRuntimeStatus) =>
      updateCurrentRequest((previous) => ({ ...previous, status })),
    [updateCurrentRequest],
  )
  const { handleNormalizedEvent, resetRuntimeEventState } =
    useExploreRuntimeEvents({
      setCurrentMessageId,
      setLatestTaskId,
      setLastError,
      setStatus,
      updateMessageById,
    })
  const refetchSession = useCallback(
    (id: string, activeSessionId: string) => {
      void queryClient.invalidateQueries({
        queryKey: agentQueryKeys.session(id, activeSessionId),
      })
    },
    [queryClient],
  )
  const runRequest = useExploreRunRequest({
    owner,
    canSend,
    createAgentSession,
    onSessionReady,
    updateRequest,
    handleNormalizedEvent,
    resetRuntimeEventState,
    refetchSession,
  })

  const updateSelection = useCallback(
    (updater: (value: ExploreSessionView) => ExploreSessionView) => {
      setView((previous) =>
        previous.selection === selection
          ? updater(seedHistory(previous))
          : previous,
      )
    },
    [selection, seedHistory],
  )
  const setParameterDialogOpen = useCallback(
    (open: boolean) => {
      updateSelection((previous) => ({
        ...previous,
        parameterDialogOpen: open,
      }))
    },
    [updateSelection],
  )
  const submitSendRequest = useCallback(
    async (request: ExploreSendRequest, values: BeginQuery[] | null) => {
      const content = request.content?.trim() || ''
      const files = request.files || []
      if (!isTaskMode && !content && !files.length) return
      await runRequest({
        content,
        files,
        runtimeInputs: buildRuntimeInputObject(values || beginInputs),
        appendUserMessage: Boolean(content || files.length),
      })
    },
    [beginInputs, isTaskMode, runRequest],
  )
  const handleSendMessage = useCallback(
    async (request: ExploreSendRequest) => {
      if (!canSend || owner.active.current) return
      if (beginInputs.length && visible.submittedBeginInputs === null) {
        updateSelection((previous) => ({
          ...previous,
          pendingRequest: request,
          parameterDialogOpen: true,
        }))
        return
      }
      await submitSendRequest(request, visible.submittedBeginInputs)
    },
    [
      beginInputs.length,
      canSend,
      owner.active,
      submitSendRequest,
      updateSelection,
      visible.submittedBeginInputs,
    ],
  )
  const handleParametersOk = useCallback(
    async (values: BeginQuery[]) => {
      if (!canSend || owner.active.current) return
      updateSelection((previous) => ({
        ...previous,
        submittedBeginInputs: values,
        parameterDialogOpen: false,
        pendingRequest: null,
      }))
      await submitSendRequest(visible.pendingRequest || { content: '' }, values)
    },
    [
      canSend,
      owner.active,
      submitSendRequest,
      updateSelection,
      visible.pendingRequest,
    ],
  )
  const handleSubmitAwaitingInputs = useCallback(
    async (messageId: string, values: BeginQuery[]) => {
      if (!canSend || owner.active.current) return
      updateSelection((previous) => ({
        ...previous,
        messages: previous.messages.map((message) =>
          message.id === messageId
            ? { ...message, awaitingInputs: undefined }
            : message,
        ),
      }))
      await runRequest({
        content: '',
        runtimeInputs: buildRuntimeInputObject(values),
        appendUserMessage: true,
        userMessageContent: formatRuntimeInputSummary(values),
      })
    },
    [canSend, owner.active, runRequest, updateSelection],
  )
  const handleXCardAction = useCallback(
    async (payload: AgentXCardActionPayload) => {
      if (!canSend || owner.active.current) return
      const input = buildA2UIActionInput(payload)
      await runRequest({
        content: input.query,
        runtimeInputs: buildRuntimeInputObject(
          visible.submittedBeginInputs || beginInputs,
        ),
        a2ui: input.a2ui,
        metadata: input.metadata,
        appendUserMessage: true,
        userMessageContent: input.query,
      })
    },
    [
      beginInputs,
      canSend,
      owner.active,
      runRequest,
      visible.submittedBeginInputs,
    ],
  )
  const handleStop = useCallback(async () => {
    const request = owner.active.current
    if (!request || !owner.owns(request)) return
    const taskId = visible.latestTaskId
    const message = t('agent.runtime.listeningStopped')
    updateRequest(request, (previous) => ({
      ...previous,
      status: AgentRuntimeStatus.STOPPED,
      lastError: message,
      messages: previous.messages.map((row) =>
        row.id === request.assistantId ? { ...row, isStreaming: false } : row,
      ),
    }))
    request.controller.abort()
    owner.finish(request)
    if (taskId) {
      try {
        await cancelConversation(taskId)
        updateRequest(request, (previous) => ({
          ...previous,
          lastError: t('agent.runtime.cancelRequested'),
        }))
      } catch {
        if (!owner.owns(request)) return
        const message = t('agent.runtime.cancelRequestFailed')
        updateRequest(request, (previous) => ({
          ...previous,
          lastError: message,
        }))
        toast.error(message)
      }
    }
  }, [cancelConversation, owner, t, updateRequest, visible.latestTaskId])

  return {
    agent: agentQuery.data,
    session: hasHistory ? sessionQuery.data : undefined,
    sessionQuery,
    beginInputs,
    isTaskMode,
    messages,
    status:
      !visible.hasLocalMessages && historyFailure
        ? AgentRuntimeStatus.ERROR
        : visible.status,
    loading: visible.status === AgentRuntimeStatus.RUNNING,
    loadingSession,
    sessionError,
    canSend,
    lastError:
      !visible.hasLocalMessages && historyFailure
        ? historyFailure
        : visible.lastError,
    currentMessageId: visible.currentMessageId,
    latestTaskId: visible.latestTaskId,
    parameterDialogOpen: visible.parameterDialogOpen,
    setParameterDialogOpen,
    handleParametersOk,
    handleSendMessage,
    handleSubmitAwaitingInputs,
    handleXCardAction,
    handleStop,
  }
}
