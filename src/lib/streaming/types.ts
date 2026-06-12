/**
 * Typed event envelopes for the shared streaming runtime (ARCH-1).
 *
 * Two independent shapes coexist on the wire:
 * - `SSEEnvelope<TData>`: the generic backend wrapper used by conversation /
 *   report / agent streams (`data === true` is the terminal frame).
 * - `StructuredStreamMessage`: the structured message union consolidated from
 *   the former hand-rolled EnhancedSSEParser (type source unified in ARCH-1
 *   phase 1; the parser itself was deleted in phase 3 — see
 *   `structured-chat-reducer.ts` for the ported state machine).
 *
 * Per-surface payloads instantiate the transport generic
 * (e.g. `readSSEStream<SSEEnvelope<ReportProgress>>`); there is deliberately
 * no global union of all surface payloads.
 */

export interface SSEEnvelope<TData = unknown> {
  /** 0 = ok; non-zero means an error frame (some backends use `code`). */
  retcode?: number
  code?: number
  retmsg?: string
  /** Payload; `true` marks the terminal frame; legacy streams send strings. */
  data?: TData | string | boolean
  /** Legacy think-block markers emitted at the envelope root. */
  start_to_think?: boolean
  end_to_think?: boolean
}

export type StreamMessageType =
  | 'text'
  | 'tool_call'
  | 'tool_result'
  | 'tool_start'
  | 'tool_end'
  | 'error'
  | 'complete'
  | 'metadata'

export const StreamMessageTypes = {
  TEXT: 'text',
  TOOL_CALL: 'tool_call',
  TOOL_RESULT: 'tool_result',
  TOOL_START: 'tool_start',
  TOOL_END: 'tool_end',
  ERROR: 'error',
  COMPLETE: 'complete',
  METADATA: 'metadata',
} as const

export interface StreamMessageBase {
  type: StreamMessageType
  content: unknown
  metadata?: Record<string, unknown>
}

export interface TextStreamMessage extends StreamMessageBase {
  type: 'text'
  content: string
  accumulated?: string
}

export interface ToolCallStreamMessage extends StreamMessageBase {
  type: 'tool_call'
  content: {
    tool_name: string
    arguments: Record<string, unknown>
    call_id?: string
  }
}

export interface ToolResultStreamMessage extends StreamMessageBase {
  type: 'tool_result'
  content: {
    tool_name: string
    result: unknown
    call_id?: string
    success: boolean
    error?: string
  }
}

export interface ToolStartStreamMessage extends StreamMessageBase {
  type: 'tool_start'
  content: string
}

export interface ToolEndStreamMessage extends StreamMessageBase {
  type: 'tool_end'
  content: {
    total_calls: number
    summary?: string
  }
}

export interface ErrorStreamMessage extends StreamMessageBase {
  type: 'error'
  content: {
    error: string
    code?: number
  }
}

export interface CompleteStreamMessage extends StreamMessageBase {
  type: 'complete'
  content: boolean
  metadata?: {
    total_text_length?: number
    total_tool_calls?: number
    token_count?: number
    duration?: number
  }
}

export interface MetadataStreamMessage extends StreamMessageBase {
  type: 'metadata'
  content: {
    token_count?: number
    model?: string
    duration?: number
    [key: string]: unknown
  }
}

export type StructuredStreamMessage =
  | TextStreamMessage
  | ToolCallStreamMessage
  | ToolResultStreamMessage
  | ToolStartStreamMessage
  | ToolEndStreamMessage
  | ErrorStreamMessage
  | CompleteStreamMessage
  | MetadataStreamMessage

/** Tool-call lifecycle row rendered by chat tool-call UIs. */
export interface StreamToolCallInfo {
  id: string
  name: string
  arguments: Record<string, unknown>
  result?: unknown
  status: 'pending' | 'running' | 'success' | 'error'
  timestamp: string
}
