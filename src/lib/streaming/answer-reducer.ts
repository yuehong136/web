import { extractThinkContent } from '@/utils/think-utils'

const THINK_OPEN_TAG = '<think>'
const THINK_CLOSE_TAG = '</think>'
const ERROR_TEXT_MARKER = '**ERROR**:'
// Codes the backend LLM layer writes after its in-band error sentinel
// (`**ERROR**: <code> - <upstream message>`, MultiRAG `LLMErrorCode`).
const MODEL_ERROR_CODE_PATTERN =
  /^\s*(RATE_LIMIT_EXCEEDED|AUTH_ERROR|INVALID_REQUEST|SERVER_ERROR|TIMEOUT|CONNECTION_ERROR|MODEL_ERROR|ERROR_MAX_ROUNDS|CONTENT_FILTERED|QUOTA_EXCEEDED|MAX_RETRIES_EXCEEDED|GENERIC_ERROR) - /

/**
 * `completed` is only reached through the `data: true` terminal frame.
 * `failed` is sticky: later frames, including `data: true`, never turn it
 * back into success.
 */
export type StreamingAnswerPhase = 'streaming' | 'completed' | 'failed'

/**
 * Classification only. Backend error text can carry upstream internals, so
 * it is never kept and can never be rendered from this state.
 */
export type StreamingAnswerFailure =
  | { kind: 'error_frame'; code: number }
  | { kind: 'model_error'; code: string | null }

export type StreamingAnswerFailureNotice =
  | 'chat.stream.failed'
  | 'chat.stream.interrupted'

export interface StreamingAnswerState {
  /** Raw accumulation; may hold backend error text, so render content/thinking. */
  fullAnswer: string
  content: string
  thinking: string
  phase: StreamingAnswerPhase
  failure: StreamingAnswerFailure | null
}

export interface StreamingAnswerChunkResult {
  nextState: StreamingAnswerState
  isDone: boolean
  isFinal: boolean
  payload: unknown
}

export interface StreamingAnswerChunkOptions {
  /**
   * Treat the backend `**ERROR**:` sentinel in answer text as a failure.
   * Defaults to true; Agent runtime events opt out until their stream
   * dialect is unified with chat completions.
   */
  detectErrorText?: boolean
}

interface StreamingPayload {
  answer?: unknown
  start_to_think?: unknown
  end_to_think?: unknown
  final?: unknown
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const mergeAnswerText = (previous: string, incoming: string): string => {
  if (!incoming) return previous
  if (previous && incoming.startsWith(previous)) {
    return incoming
  }
  return previous + incoming
}

const hasUnclosedThinkTag = (value: string): boolean => {
  return extractThinkContent(value).status === 'thinking'
}

const startsWithThinkOpenTag = (value: string): boolean => {
  return /^\s*<think(?:ing)?>/i.test(value)
}

const applyThinkStartMarker = (value: string, incoming = ''): string => {
  if (hasUnclosedThinkTag(value) || startsWithThinkOpenTag(incoming)) {
    return value
  }
  return value + THINK_OPEN_TAG
}

const applyThinkEndMarker = (value: string): string => {
  const parsed = extractThinkContent(value)
  if (!parsed.openThinkingTag) return value
  return value + `</${parsed.openThinkingTag}>`
}

const extractThinkContentStrict = (
  raw: string,
): { content: string; thinking: string } => {
  const parsed = extractThinkContent(raw)
  return {
    content: parsed.contentWithoutThinking,
    thinking: parsed.thinkContent,
  }
}

// The final frame carries the authoritative full answer with citation markers
// inserted mid-text, so it replaces the accumulated deltas instead of being
// merged into them. Closed reasoning the final text omits is kept.
const replaceWithFinalAnswer = (
  accumulated: string,
  finalAnswer: string,
): string => {
  const previous = extractThinkContent(accumulated)
  const final = extractThinkContent(finalAnswer)
  const retrieval =
    previous.retrievalStatus === 'complete' && final.retrievalStatus === 'none'
      ? previous.retrievalMarkup
      : ''
  const thinking =
    final.status === 'none' && previous.status === 'complete'
      ? `${THINK_OPEN_TAG}${previous.thinkContent}${THINK_CLOSE_TAG}`
      : ''
  return retrieval + thinking + finalAnswer
}

// Returns where the backend error sentinel starts. Without a known code only
// a reply that opens with it counts, so quoted text elsewhere is kept.
const findErrorText = (value: string): number | null => {
  let index = value.indexOf(ERROR_TEXT_MARKER)
  while (index >= 0) {
    const rest = value.slice(index + ERROR_TEXT_MARKER.length)
    if (MODEL_ERROR_CODE_PATTERN.test(rest) || !value.slice(0, index).trim()) {
      return index
    }
    index = value.indexOf(ERROR_TEXT_MARKER, index + ERROR_TEXT_MARKER.length)
  }
  return null
}

const toFailedOnErrorText = (
  state: StreamingAnswerState,
): StreamingAnswerState => {
  const contentIndex = findErrorText(state.content)
  const thinkingIndex = findErrorText(state.thinking)
  const errorText =
    contentIndex !== null
      ? state.content.slice(contentIndex)
      : thinkingIndex !== null
        ? state.thinking.slice(thinkingIndex)
        : null
  if (errorText === null) return state

  const code =
    MODEL_ERROR_CODE_PATTERN.exec(
      errorText.slice(ERROR_TEXT_MARKER.length),
    )?.[1] ?? null

  return {
    ...state,
    content:
      contentIndex === null
        ? state.content
        : state.content.slice(0, contentIndex).trimEnd(),
    thinking:
      thinkingIndex === null
        ? state.thinking
        : state.thinking.slice(0, thinkingIndex).trimEnd(),
    phase: 'failed',
    failure: { kind: 'model_error', code },
  }
}

export const createInitialStreamingAnswerState = (): StreamingAnswerState => ({
  fullAnswer: '',
  content: '',
  thinking: '',
  phase: 'streaming',
  failure: null,
})

/**
 * Fixed product notice for a failed answer, chosen only by whether partial
 * content survived; callers render it with `t()` and keep that content.
 */
export const getStreamingAnswerFailureNotice = (
  state: StreamingAnswerState,
): StreamingAnswerFailureNotice | null => {
  if (state.phase !== 'failed') return null
  return state.content.trim() ? 'chat.stream.interrupted' : 'chat.stream.failed'
}

export const finalizeStreamingAnswerState = (
  state: StreamingAnswerState,
): StreamingAnswerState => {
  // Completion, EOF and cancellation do not supply a missing closing marker.
  // Keep the same explicit boundaries used when replaying persisted history.
  return state
}

export const consumeStreamingAnswerChunk = (
  previousState: StreamingAnswerState,
  rawChunk: unknown,
  { detectErrorText = true }: StreamingAnswerChunkOptions = {},
): StreamingAnswerChunkResult => {
  if (!isRecord(rawChunk)) {
    return {
      nextState: previousState,
      isDone: false,
      isFinal: false,
      payload: undefined,
    }
  }

  const payload = rawChunk.data

  if (payload === true) {
    return {
      nextState:
        previousState.phase === 'streaming'
          ? { ...previousState, phase: 'completed' }
          : previousState,
      isDone: true,
      isFinal: true,
      payload,
    }
  }

  // Frames after a terminal state are late arrivals and change nothing.
  if (previousState.phase !== 'streaming') {
    return { nextState: previousState, isDone: false, isFinal: false, payload }
  }

  const retcode =
    typeof rawChunk.retcode === 'number'
      ? rawChunk.retcode
      : typeof rawChunk.code === 'number'
        ? rawChunk.code
        : 0

  // Error frames keep the partial answer; their text is never surfaced.
  if (retcode !== 0) {
    return {
      nextState: {
        ...previousState,
        phase: 'failed',
        failure: { kind: 'error_frame', code: retcode },
      },
      isDone: false,
      isFinal: false,
      payload,
    }
  }

  let nextFullAnswer = previousState.fullAnswer
  let isFinal = false
  const startToThink = rawChunk.start_to_think === true
  const endToThink = rawChunk.end_to_think === true

  if (typeof payload === 'string') {
    if (startToThink) {
      nextFullAnswer = applyThinkStartMarker(nextFullAnswer, payload)
    }
    if (endToThink) {
      nextFullAnswer = applyThinkEndMarker(nextFullAnswer)
    }
    nextFullAnswer = mergeAnswerText(nextFullAnswer, payload)
  } else if (isRecord(payload)) {
    const streamPayload = payload as StreamingPayload
    const answer =
      typeof streamPayload.answer === 'string' ? streamPayload.answer : ''
    const chunkStartsThinking =
      startToThink || streamPayload.start_to_think === true
    const chunkEndsThinking = endToThink || streamPayload.end_to_think === true

    if (chunkStartsThinking) {
      nextFullAnswer = applyThinkStartMarker(nextFullAnswer, answer)
    }

    if (chunkEndsThinking) {
      nextFullAnswer = applyThinkEndMarker(nextFullAnswer)
    }

    isFinal = streamPayload.final === true

    if (answer) {
      nextFullAnswer = isFinal
        ? replaceWithFinalAnswer(nextFullAnswer, answer)
        : mergeAnswerText(nextFullAnswer, answer)
    }
  }

  const think = extractThinkContentStrict(nextFullAnswer)
  const nextState: StreamingAnswerState = {
    fullAnswer: nextFullAnswer,
    content: think.content,
    thinking: think.thinking,
    phase: 'streaming',
    failure: null,
  }

  return {
    nextState: detectErrorText ? toFailedOnErrorText(nextState) : nextState,
    isDone: false,
    isFinal,
    payload,
  }
}
