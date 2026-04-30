import { useCallback, useMemo, useRef, useState } from 'react'
import { EventSourceParserStream } from 'eventsource-parser/stream'
import { agentAPI } from '@/api/agent'
import {
  consumeRuntimeMessageChunk,
  normalizeRuntimeAttachments,
  normalizeRuntimeAwaitingInputs,
  normalizeRuntimeEvent,
} from '../features/runtime-workbench/utils'
import { shouldStoreRuntimeThoughtEvent } from '../features/runtime-workbench/thought-chain-utils'
import {
  buildA2UIActionInput,
  mergeSurfaceIds,
  type AgentXCardActionPayload,
} from '../x-card'
import type { ShareRuntimeMessage } from './types'
import type { ShareFormValues } from './utils'

interface UseSharedAgentRunnerOptions {
  agentId: string
  betaToken: string
  release?: boolean
  userId?: string
  buildInputs: (values: ShareFormValues) => Record<string, unknown>
}

const createMessageId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

export function useSharedAgentRunner({
  agentId,
  betaToken,
  release,
  userId,
  buildInputs,
}: UseSharedAgentRunnerOptions) {
  const [messages, setMessages] = useState<ShareRuntimeMessage[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [lastError, setLastError] = useState<string>()
  const abortControllerRef = useRef<AbortController | null>(null)
  const messageStateRef = useRef<
    Record<string, ReturnType<typeof consumeRuntimeMessageChunk>['nextState']>
  >({})

  const hasMessages = messages.length > 0

  const updateMessageById = useCallback(
    (
      messageId: string,
      updater: (message: ShareRuntimeMessage) => ShareRuntimeMessage,
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
    const assistantId = createMessageId('assistant')
    setMessages((previous) => [
      ...previous,
      {
        id: assistantId,
        role: 'assistant',
        content: '',
        thinking: '',
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

      const logEvent = normalizedEvent.logEvent

      if (
        logEvent &&
        shouldStoreRuntimeThoughtEvent(logEvent.event, logEvent.data)
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

      if (normalizedEvent.errorMessage) {
        setLastError(normalizedEvent.errorMessage)
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
    [updateMessageById],
  )

  const submit = useCallback(
    async ({
      query,
      values,
      files = [],
      userMessage,
      inputPayload,
      a2ui,
      metadata,
    }: {
      query?: string
      values: ShareFormValues
      files?: unknown[]
      userMessage?: string
      inputPayload?: Record<string, unknown>
      a2ui?: Array<Record<string, unknown>>
      metadata?: Record<string, unknown>
    }) => {
      if (!agentId || !betaToken || isRunning) {
        return
      }

      const content = userMessage ?? query ?? ''
      if (content || files.length > 0) {
        setMessages((previous) => [
          ...previous,
          {
            id: createMessageId('user'),
            role: 'user',
            content,
            files: files as ShareRuntimeMessage['files'],
          },
        ])
      }

      const assistantId = appendAssistantPlaceholder()
      const abortController = new AbortController()
      abortControllerRef.current = abortController
      setIsRunning(true)
      setLastError(undefined)

      try {
        const response = await agentAPI.runExternalAgent(
          {
            id: agentId,
            betaToken,
            query,
            inputs: inputPayload || buildInputs(values),
            a2ui,
            metadata,
            files,
            session_id: sessionId,
            release,
            user_id: userId,
          },
          { signal: abortController.signal },
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
          throw new Error('公共运行接口没有返回可读的数据流')
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
            handleNormalizedEvent(assistantId, JSON.parse(rawData))
          } catch {
            // ignore malformed SSE chunks
          }
        }

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
        updateMessageById(assistantId, (message) => ({
          ...message,
          content: message.content || errorMessage,
          error: errorMessage,
          isStreaming: false,
        }))
      } finally {
        setIsRunning(false)
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null
        }
      }
    },
    [
      agentId,
      appendAssistantPlaceholder,
      betaToken,
      buildInputs,
      handleNormalizedEvent,
      isRunning,
      release,
      sessionId,
      updateMessageById,
      userId,
    ],
  )

  const stop = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  const submitXCardAction = useCallback(
    async (payload: AgentXCardActionPayload) => {
      const actionInput = buildA2UIActionInput(payload)

      await submit({
        query: actionInput.query,
        values: {} as ShareFormValues,
        userMessage: actionInput.query,
        inputPayload: {},
        a2ui: actionInput.a2ui,
        metadata: actionInput.metadata,
      })
    },
    [submit],
  )

  const clearAwaitingInputs = useCallback((messageId: string) => {
    updateMessageById(messageId, (message) => ({
      ...message,
      awaitingInputs: undefined,
    }))
  }, [updateMessageById])

  const reset = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    messageStateRef.current = {}
    setMessages([])
    setSessionId(null)
    setLastError(undefined)
    setIsRunning(false)
  }, [])

  const appendAssistantMessage = useCallback((content: string) => {
    if (!content.trim()) {
      return
    }

    setMessages((previous) => {
      const exists = previous.some(
        (message) =>
          message.role === 'assistant' && message.content === content,
      )
      if (exists) {
        return previous
      }

      return [
        ...previous,
        {
          id: createMessageId('prologue'),
          role: 'assistant',
          content,
          isStreaming: false,
        },
      ]
    })
  }, [])

  return useMemo(
    () => ({
      messages,
      hasMessages,
      isRunning,
      lastError,
      sessionId,
      appendAssistantMessage,
      clearAwaitingInputs,
      submit,
      submitXCardAction,
      stop,
      reset,
    }),
    [
      hasMessages,
      isRunning,
      lastError,
      messages,
      appendAssistantMessage,
      clearAwaitingInputs,
      reset,
      sessionId,
      stop,
      submit,
      submitXCardAction,
    ],
  )
}
