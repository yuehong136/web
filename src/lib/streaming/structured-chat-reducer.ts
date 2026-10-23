import type {
  CompleteStreamMessage,
  ErrorStreamMessage,
  StreamToolCallInfo,
  StructuredStreamMessage,
  TextStreamMessage,
  ToolCallStreamMessage,
  ToolEndStreamMessage,
  ToolResultStreamMessage,
  ToolStartStreamMessage,
} from './types'
import {
  getServerRunPhase,
  isRunTerminal,
  type RunPhase,
} from './run-lifecycle'

/**
 * Structured-chat message reducer (ARCH-1 phase 3).
 *
 * Preserves legacy text/think/tool payloads while requiring explicit server
 * terminal events. Connection closure never completes a run or its tools.
 */

export interface StructuredChatState {
  accumulatedText: string
  toolCalls: StreamToolCallInfo[]
  isToolAnalyzing: boolean
  metadata: Record<string, unknown>
  /** Structured tool calls keyed by call id (insertion order preserved). */
  toolCallById: ReadonlyMap<string, StreamToolCallInfo>
  /** True once a server-emitted complete frame passed through the reducer. */
  completeSeen: boolean
  phase: RunPhase
}

export interface StructuredChatChunkResult {
  nextState: StructuredChatState
  message: StructuredStreamMessage | null
}

interface StructuredChatDraft {
  accumulatedText: string
  toolCalls: StreamToolCallInfo[]
  isToolAnalyzing: boolean
  metadata: Record<string, unknown>
  toolCallById: Map<string, StreamToolCallInfo>
  completeSeen: boolean
  phase: RunPhase
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const hasOpenThinkTag = (content: string): boolean => {
  const openCount =
    (content.match(/<think>/g) || []).length +
    (content.match(/<thinking>/g) || []).length
  const closeCount =
    (content.match(/<\/think>/g) || []).length +
    (content.match(/<\/thinking>/g) || []).length
  return openCount > closeCount
}

const updateToolCallsList = (draft: StructuredChatDraft): void => {
  draft.toolCalls = Array.from(draft.toolCallById.values())
}

const processToolCall = (
  draft: StructuredChatDraft,
  content: Record<string, unknown>,
): void => {
  const callId = content.call_id as string | undefined
  if (callId && draft.toolCallById.has(callId)) return
  const newToolCall: StreamToolCallInfo = {
    id: (content.call_id as string) || `call_${Date.now()}_${Math.random()}`,
    name: content.tool_name as string,
    arguments: (content.arguments as Record<string, unknown>) || {},
    status: 'running',
    timestamp: new Date().toLocaleTimeString(),
  }

  draft.toolCallById.set(newToolCall.id, newToolCall)
  updateToolCallsList(draft)
}

const processToolResult = (
  draft: StructuredChatDraft,
  content: Record<string, unknown>,
): void => {
  const callId = content.call_id as string | undefined
  if (callId && draft.toolCallById.has(callId)) {
    const toolCall = draft.toolCallById.get(callId)!
    if (toolCall.status === 'success' || toolCall.status === 'error') return
    if (typeof content.success !== 'boolean') return
    const updated: StreamToolCallInfo = {
      ...toolCall,
      result:
        content.success === false && content.error
          ? content.error
          : content.result,
      status: content.success === true ? 'success' : 'error',
    }
    draft.toolCallById.set(callId, updated)
    updateToolCallsList(draft)
  }
}

const processStructuredMessage = (
  draft: StructuredChatDraft,
  message: Record<string, unknown>,
): StructuredStreamMessage | null => {
  const serverPhase = getServerRunPhase(String(message.type))
  if (serverPhase) {
    draft.phase = serverPhase
    if (isRunTerminal(serverPhase)) draft.isToolAnalyzing = false
    return {
      type: message.type,
      content: message.payload ?? message.content,
    } as StructuredStreamMessage
  }
  switch (message.type) {
    case 'text': {
      const incoming =
        typeof message.content === 'string' ? message.content : ''
      const nextContent =
        draft.accumulatedText && incoming.startsWith(draft.accumulatedText)
          ? incoming
          : draft.accumulatedText + incoming
      if (nextContent === draft.accumulatedText) {
        return null
      }
      // Compatible with both accumulated-text and delta-text backends.
      draft.accumulatedText = nextContent
      return {
        type: 'text',
        content: nextContent,
        accumulated: nextContent,
      } as TextStreamMessage
    }

    case 'tool_call':
      processToolCall(draft, isRecord(message.content) ? message.content : {})
      return {
        type: 'tool_call',
        content: message.content,
      } as ToolCallStreamMessage

    case 'tool_result':
      processToolResult(draft, isRecord(message.content) ? message.content : {})
      return {
        type: 'tool_result',
        content: message.content,
      } as ToolResultStreamMessage

    case 'tool_start':
      draft.isToolAnalyzing = true
      return {
        type: 'tool_start',
        content: message.content,
      } as ToolStartStreamMessage

    case 'tool_end':
      draft.isToolAnalyzing = false
      return {
        type: 'tool_end',
        content: message.content,
      } as ToolEndStreamMessage

    case 'error':
      draft.phase = 'failed'
      draft.isToolAnalyzing = false
      return message as unknown as StructuredStreamMessage
    case 'complete':
      if (message.content !== true) return null
      draft.phase = 'completed'
      draft.isToolAnalyzing = false
      return message as unknown as StructuredStreamMessage
    case 'metadata':
      if (message.type === 'metadata' && isRecord(message.content)) {
        draft.metadata = { ...draft.metadata, ...message.content }
      }
      return message as unknown as StructuredStreamMessage

    default:
      return message as unknown as StructuredStreamMessage
  }
}

const processLegacyMessage = (
  draft: StructuredChatDraft,
  content: string,
  markerMutated = false,
): StructuredStreamMessage | null => {
  const previousText = draft.accumulatedText

  // Parse tool calls from legacy format using the original regex.
  const toolCallRegex = /<tool_call>(.*?)<\/tool_call>/gs
  const toolCalls: StreamToolCallInfo[] = []

  let match: RegExpExecArray | null
  while ((match = toolCallRegex.exec(content)) !== null) {
    try {
      const toolCallData = JSON.parse(match[1]) as Record<string, unknown>
      const toolCall: StreamToolCallInfo = {
        id: `legacy_${Date.now()}_${Math.random()}`,
        name: toolCallData.name as string,
        arguments: (toolCallData.args as Record<string, unknown>) || {},
        result: toolCallData.result,
        status:
          toolCallData.result === undefined ||
          toolCallData.result === 'Begin to call...'
            ? 'running'
            : 'success',
        timestamp: new Date().toLocaleTimeString(),
      }
      toolCalls.push(toolCall)
    } catch {
      // Malformed model output is skipped without logging its contents.
    }
  }

  // Remove tool_call tags from content, keep whitespace/newlines for streaming fidelity.
  const cleanContent = content.replace(toolCallRegex, '')

  // Compatible with both accumulated-text and delta-text legacy payloads.
  const mergedContent =
    previousText && cleanContent.startsWith(previousText)
      ? cleanContent
      : previousText + cleanContent

  // Update state:
  // - Do not clear previously parsed structured tool calls on normal text chunks.
  // - Legacy streams may include repeated cumulative payloads, so de-duplicate by payload signature.
  if (toolCalls.length > 0) {
    const existing = draft.toolCalls
    const mergedMap = new Map<string, StreamToolCallInfo>()

    for (const call of existing) {
      const key = `${call.name}:${JSON.stringify(call.arguments || {})}:${JSON.stringify(call.result ?? '')}`
      mergedMap.set(key, call)
    }

    for (const call of toolCalls) {
      const key = `${call.name}:${JSON.stringify(call.arguments || {})}:${JSON.stringify(call.result ?? '')}`
      const prev = mergedMap.get(key)
      mergedMap.set(key, prev ? { ...call, id: prev.id } : call)
    }

    draft.toolCalls = Array.from(mergedMap.values())
  }
  draft.accumulatedText = mergedContent

  if (mergedContent === previousText && !markerMutated) {
    return null
  }

  return {
    type: 'text',
    content: mergedContent,
    accumulated: mergedContent,
  } as TextStreamMessage
}

const handleMessage = (
  draft: StructuredChatDraft,
  message: Record<string, unknown>,
): StructuredStreamMessage | null => {
  // Check for wrapped format (retcode/retmsg/data)
  if (('retcode' in message || 'code' in message) && 'data' in message) {
    // Handle error cases
    if ((message.retcode ?? message.code) !== 0) {
      draft.phase = 'failed'
      draft.isToolAnalyzing = false
      return {
        type: 'error',
        content: {
          error: (message.retmsg as string) || 'Unknown error',
          code: (message.retcode ?? message.code) as number,
        },
      } as ErrorStreamMessage
    }

    // Handle completion marker
    if (message.data === true) {
      draft.phase = 'completed'
      draft.isToolAnalyzing = false
      return {
        type: 'complete',
        content: true,
        metadata: draft.metadata,
      } as CompleteStreamMessage
    }

    // Handle root-level think markers in legacy stream:
    // { retcode: 0, data: "", start_to_think: true } / end_to_think
    // We append think tags into accumulated text so existing UI can parse/render think blocks.
    let markerMutated = false
    if (
      message.start_to_think === true &&
      !hasOpenThinkTag(draft.accumulatedText)
    ) {
      draft.accumulatedText += '<think>'
      markerMutated = true
    }
    if (
      message.end_to_think === true &&
      hasOpenThinkTag(draft.accumulatedText)
    ) {
      draft.accumulatedText += '</think>'
      markerMutated = true
    }

    // Check if data contains structured message
    if (isRecord(message.data) && 'type' in message.data) {
      // Handle structured message
      const structured = processStructuredMessage(draft, message.data)
      if (structured) {
        return structured
      }
      if (markerMutated) {
        return {
          type: 'text',
          content: draft.accumulatedText,
          accumulated: draft.accumulatedText,
        } as TextStreamMessage
      }
      return null
    } else if (isRecord(message.data) && 'answer' in message.data) {
      // Compatibility: wrapped answer object in some legacy branches
      const answer =
        typeof message.data.answer === 'string' ? message.data.answer : ''
      return processLegacyMessage(draft, answer, markerMutated)
    } else if (typeof message.data === 'string') {
      // Handle legacy unstructured format
      return processLegacyMessage(draft, message.data, markerMutated)
    }

    if (markerMutated) {
      return {
        type: 'text',
        content: draft.accumulatedText,
        accumulated: draft.accumulatedText,
      } as TextStreamMessage
    }
  } else if ('type' in message) {
    // Direct structured message (no wrapper)
    return processStructuredMessage(draft, message)
  }

  return null
}

export const createInitialStructuredChatState = (): StructuredChatState => ({
  accumulatedText: '',
  toolCalls: [],
  isToolAnalyzing: false,
  metadata: {},
  toolCallById: new Map(),
  completeSeen: false,
  phase: 'running',
})

export const consumeStructuredChatChunk = (
  previousState: StructuredChatState,
  rawEvent: unknown,
): StructuredChatChunkResult => {
  if (!isRecord(rawEvent) || isRunTerminal(previousState.phase)) {
    return { nextState: previousState, message: null }
  }

  const draft: StructuredChatDraft = {
    accumulatedText: previousState.accumulatedText,
    toolCalls: previousState.toolCalls,
    isToolAnalyzing: previousState.isToolAnalyzing,
    metadata: previousState.metadata,
    toolCallById: new Map(previousState.toolCallById),
    completeSeen: previousState.completeSeen,
    phase: previousState.phase,
  }

  const message = handleMessage(draft, rawEvent)

  if (message && draft.phase === 'completed') {
    draft.completeSeen = true
  }

  return { nextState: draft, message }
}

/** A closed connection never supplies a missing server completion frame. */
export const finalizeStructuredChatState = (
  state: StructuredChatState,
  reason: 'eof' | 'aborted' | 'error',
): StructuredChatState => {
  if (isRunTerminal(state.phase)) return state
  return {
    ...state,
    phase: reason === 'aborted' ? 'locallyStopped' : 'interrupted',
    isToolAnalyzing: false,
  }
}
