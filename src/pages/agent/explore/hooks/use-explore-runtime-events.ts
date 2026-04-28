import { useCallback, useRef } from 'react'
import type { MutableRefObject } from 'react'
import {
  AgentRuntimeStatus,
  type RuntimeMessage,
} from '../../features/runtime-workbench/types'
import {
  consumeRuntimeMessageChunk,
  normalizeRuntimeAttachments,
  normalizeRuntimeAwaitingInputs,
  normalizeRuntimeEvent,
} from '../../features/runtime-workbench/utils'

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

export function useExploreRuntimeEvents({
  sessionIdRef,
  onSessionReady,
  setCurrentMessageId,
  setLatestTaskId,
  setLastError,
  setStatus,
  updateMessageById,
}: {
  sessionIdRef: MutableRefObject<string>
  onSessionReady: (sessionId: string) => void
  setCurrentMessageId: (messageId: string | undefined) => void
  setLatestTaskId: (taskId: string | undefined) => void
  setLastError: (error: string | undefined) => void
  setStatus: (status: AgentRuntimeStatus) => void
  updateMessageById: (
    messageId: string,
    updater: (message: RuntimeMessage) => RuntimeMessage,
  ) => void
}) {
  const messageStateRef = useRef<Record<string, ReturnType<typeof consumeRuntimeMessageChunk>['nextState']>>({})

  const resetRuntimeEventState = useCallback(() => {
    messageStateRef.current = {}
    setCurrentMessageId(undefined)
    setLatestTaskId(undefined)
  }, [setCurrentMessageId, setLatestTaskId])

  const handleNormalizedEvent = useCallback(
    (assistantId: string, rawEvent: unknown) => {
      const normalizedEvent = normalizeRuntimeEvent(rawEvent)

      if (normalizedEvent.sessionId && normalizedEvent.sessionId !== sessionIdRef.current) {
        sessionIdRef.current = normalizedEvent.sessionId
        onSessionReady(normalizedEvent.sessionId)
      }

      if (normalizedEvent.messageId) {
        setCurrentMessageId(normalizedEvent.messageId)
      }

      if (normalizedEvent.taskId) {
        setLatestTaskId(normalizedEvent.taskId)
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
    [
      onSessionReady,
      sessionIdRef,
      setCurrentMessageId,
      setLastError,
      setLatestTaskId,
      setStatus,
      updateMessageById,
    ],
  )

  return {
    handleNormalizedEvent,
    resetRuntimeEventState,
  }
}
