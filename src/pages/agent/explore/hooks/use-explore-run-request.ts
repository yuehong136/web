import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { agentAPI } from '@/api/agent'
import { toast } from '@/lib/toast'
import type { AgentSession, CreateAgentSessionInput } from '@/types/agent'
import { agentRunErrorKey } from '../../runtime-errors'
import { AgentRuntimeStatus } from '../../features/runtime-workbench/types'
import {
  consumeRuntimeStream,
  createLocalRuntimeMessageId,
} from '../../features/runtime-workbench/runtime-stream'
import type {
  ExploreRequestOwner,
  ExploreRunRequest,
  ExploreSessionView,
} from '../types'
import { buildExploreSessionName } from '../utils'
import type { useExploreRequestOwner } from './use-explore-request-owner'

export function useExploreRunRequest({
  owner,
  canSend,
  createAgentSession,
  onSessionReady,
  updateRequest,
  handleNormalizedEvent,
  resetRuntimeEventState,
  refetchSession,
}: {
  owner: ReturnType<typeof useExploreRequestOwner>
  canSend: boolean
  createAgentSession: (input: CreateAgentSessionInput) => Promise<AgentSession>
  onSessionReady: (sessionId: string) => void
  updateRequest: (
    request: ExploreRequestOwner,
    updater: (view: ExploreSessionView) => ExploreSessionView,
  ) => void
  handleNormalizedEvent: (
    assistantId: string,
    event: unknown,
    sessionId: string,
  ) => boolean | undefined
  resetRuntimeEventState: () => void
  refetchSession: (canvasId: string, sessionId: string) => void
}) {
  const { t } = useTranslation()
  return useCallback(
    async (input: ExploreRunRequest) => {
      if (!canSend) return
      const request = owner.begin()
      if (!request) return
      const { content = '', files = [] } = input
      updateRequest(request, (view) => ({
        ...view,
        status: AgentRuntimeStatus.RUNNING,
        lastError: undefined,
      }))
      resetRuntimeEventState()

      try {
        if (!request.sessionId) {
          try {
            const session = await createAgentSession({
              name: buildExploreSessionName(content),
              mode: request.selection.mode ?? 'draft',
            })
            if (!session.id) throw new Error('Missing session ID')
            if (!owner.rememberCreated(request, session.id)) return
            onSessionReady(session.id)
          } catch (error) {
            if (!owner.owns(request) || request.controller.signal.aborted)
              return
            const message = t(
              agentRunErrorKey(error, 'agent.runtime.createSessionFailed'),
            )
            updateRequest(request, (view) => ({
              ...view,
              status: AgentRuntimeStatus.ERROR,
              lastError: message,
            }))
            toast.error(message)
            return
          }
        }
        if (!owner.owns(request) || request.controller.signal.aborted) return
        const assistantId = createLocalRuntimeMessageId('assistant')
        request.assistantId = assistantId
        updateRequest(request, (view) => ({
          ...view,
          hasLocalMessages: true,
          messages: [
            ...view.messages,
            ...(input.appendUserMessage
              ? [
                  {
                    id: createLocalRuntimeMessageId('user'),
                    role: 'user' as const,
                    content: input.userMessageContent || content.trim(),
                    files,
                  },
                ]
              : []),
            {
              id: assistantId,
              role: 'assistant',
              content: '',
              thinking: '',
              files: [],
              isStreaming: true,
            },
          ],
        }))
        const response = await agentAPI.runAgentSession(
          {
            id: request.selection.canvasId,
            query: content,
            session_id: request.sessionId,
            files,
            inputs: input.runtimeInputs,
            a2ui: input.a2ui,
            metadata: input.metadata,
          },
          { signal: request.controller.signal },
        )
        if (!owner.owns(request) || request.controller.signal.aborted) {
          await response.body?.cancel()
          return
        }
        let acceptedEvent = false
        let foreignEvent = false
        await consumeRuntimeStream(response, (event) => {
          if (
            owner.active.current === request &&
            owner.owns(request) &&
            !request.controller.signal.aborted
          ) {
            const accepted = handleNormalizedEvent(
              assistantId,
              event,
              request.sessionId,
            )
            if (accepted === true) acceptedEvent = true
            if (accepted === false) foreignEvent = true
          }
        })
        if (!owner.owns(request) || request.controller.signal.aborted) return
        if (foreignEvent && !acceptedEvent)
          throw new Error('Foreign session stream')
        updateRequest(request, (view) => ({
          ...view,
          status:
            view.status === AgentRuntimeStatus.ERROR
              ? view.status
              : AgentRuntimeStatus.SUCCESS,
          messages: view.messages.map((message) =>
            message.id === assistantId
              ? { ...message, isStreaming: false }
              : message,
          ),
        }))
        refetchSession(request.selection.canvasId, request.sessionId)
      } catch (error) {
        if (!owner.owns(request)) return
        const stopped =
          request.controller.signal.aborted ||
          (error instanceof Error && error.name === 'AbortError')
        const message = t(
          stopped ? 'agent.runtime.listeningStopped' : agentRunErrorKey(error),
        )
        updateRequest(request, (view) => ({
          ...view,
          status: stopped
            ? AgentRuntimeStatus.STOPPED
            : AgentRuntimeStatus.ERROR,
          lastError: stopped ? view.lastError || message : message,
          messages: view.messages.map((row) =>
            row.id === request.assistantId
              ? {
                  ...row,
                  content: row.content,
                  error: message,
                  isStreaming: false,
                }
              : row,
          ),
        }))
        if (!stopped) toast.error(message)
      } finally {
        owner.finish(request)
      }
    },
    [
      canSend,
      createAgentSession,
      handleNormalizedEvent,
      onSessionReady,
      owner,
      refetchSession,
      resetRuntimeEventState,
      t,
      updateRequest,
    ],
  )
}
