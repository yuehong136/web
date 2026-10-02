import { useCallback, type Dispatch, type SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import { agentAPI } from '@/api/agent'
import { toast } from '@/lib/toast'
import type { useTaskRunOwner } from '../../../hooks/use-task-run-owner'
import {
  AgentRuntimeStatus,
  RuntimeWorkbenchView,
  type RuntimeAttachment,
  type RuntimeMessage,
} from '../types'
import { normalizeRuntimeEvent } from '../utils'
import {
  consumeRuntimeStream,
  createLocalRuntimeMessageId,
} from '../runtime-stream'

interface RuntimeRequest {
  content?: string
  files?: RuntimeAttachment[]
  runtimeInputs: Record<string, unknown>
  a2ui?: Array<Record<string, unknown>>
  metadata?: Record<string, unknown>
  appendUserMessage: boolean
  userMessageContent?: string
  skipSave?: boolean
}
interface Options {
  canvasId?: string
  sessionId: string | null
  owner: ReturnType<typeof useTaskRunOwner>
  saveCurrentGraph: () => Promise<boolean>
  appendAssistantPlaceholder: () => string
  handleNormalizedEvent: (id: string, event: unknown) => void
  updateMessageById: (
    id: string,
    updater: (message: RuntimeMessage) => RuntimeMessage,
  ) => void
  setMessages: Dispatch<SetStateAction<RuntimeMessage[]>>
  setStatus: Dispatch<SetStateAction<AgentRuntimeStatus>>
  setLastRunAt: Dispatch<SetStateAction<number | undefined>>
  setLastError: Dispatch<SetStateAction<string | undefined>>
  setLatestTaskId: Dispatch<SetStateAction<string>>
  onViewChange: (view: RuntimeWorkbenchView) => void
  refetchSessions: () => unknown
}

export function useAgentRuntimeRequest({
  canvasId,
  sessionId,
  owner,
  saveCurrentGraph,
  appendAssistantPlaceholder,
  handleNormalizedEvent,
  updateMessageById,
  setMessages,
  setStatus,
  setLastRunAt,
  setLastError,
  setLatestTaskId,
  onViewChange,
  refetchSessions,
}: Options) {
  const { t } = useTranslation()
  return useCallback(
    async ({
      content = '',
      files = [],
      runtimeInputs,
      a2ui,
      metadata,
      appendUserMessage,
      userMessageContent,
      skipSave = false,
    }: RuntimeRequest) => {
      if (!canvasId) {
        toast.error(t('agent.runtime.runFailed'))
        return
      }
      const attempt = owner.begin()
      // A new request has no task ID until its own SSE advertises one.
      setLatestTaskId('')
      setLastError(undefined)
      const isActive = () =>
        owner.owns(attempt) && !attempt.controller.signal.aborted
      try {
        if (!skipSave) {
          setStatus(AgentRuntimeStatus.PREPARING)
          const saved = await saveCurrentGraph()
          if (!isActive()) return
          if (!saved) {
            setStatus(AgentRuntimeStatus.ERROR)
            return
          }
        }
        if (appendUserMessage)
          setMessages((previous) => [
            ...previous,
            {
              id: createLocalRuntimeMessageId('user'),
              role: 'user',
              content: userMessageContent || content.trim(),
              files,
            },
          ])
        const assistantId = appendAssistantPlaceholder()
        attempt.assistantId = assistantId
        onViewChange(RuntimeWorkbenchView.CONVERSATION)
        setLastRunAt(Date.now())
        setStatus(AgentRuntimeStatus.RUNNING)
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
          { signal: attempt.controller.signal },
        )
        if (!isActive()) {
          await response.body?.cancel()
          return
        }
        await consumeRuntimeStream(response, (event) => {
          if (!isActive()) return
          const taskId = normalizeRuntimeEvent(event).taskId
          if (taskId) {
            attempt.taskId = taskId
            setLatestTaskId(taskId)
          }
          handleNormalizedEvent(assistantId, event)
        })
        if (!isActive()) return
        setStatus((current) =>
          current === AgentRuntimeStatus.ERROR
            ? current
            : AgentRuntimeStatus.SUCCESS,
        )
        updateMessageById(assistantId, (message) => ({
          ...message,
          isStreaming: false,
        }))
        void refetchSessions()
      } catch {
        // Explicit stop already owns local feedback; obsolete requests own nothing.
        if (!isActive()) return
        const message = t('agent.runtime.runFailed')
        setLastError(message)
        setStatus(AgentRuntimeStatus.ERROR)
        if (attempt.assistantId)
          updateMessageById(attempt.assistantId, (row) => ({
            ...row,
            content: row.content || message,
            error: message,
            isStreaming: false,
          }))
        toast.error(message)
        void refetchSessions()
      } finally {
        owner.finish(attempt)
      }
    },
    [
      appendAssistantPlaceholder,
      canvasId,
      handleNormalizedEvent,
      onViewChange,
      owner,
      refetchSessions,
      saveCurrentGraph,
      sessionId,
      setLastError,
      setLastRunAt,
      setLatestTaskId,
      setMessages,
      setStatus,
      t,
      updateMessageById,
    ],
  )
}
