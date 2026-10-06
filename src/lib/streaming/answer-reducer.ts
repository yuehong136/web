const THINK_OPEN_TAG = '<think>'
const THINK_CLOSE_TAG = '</think>'
const THINK_OPEN_PATTERN = /<think(?:ing)?>/i
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

const normalizeMainContent = (value: string): string => {
  return value.replace(/^\n+/, '')
}

const hasUnclosedThinkTag = (value: string): boolean => {
  const openCount =
    (value.match(/<think>/g) || []).length +
    (value.match(/<thinking>/g) || []).length
  const closeCount =
    (value.match(/<\/think>/g) || []).length +
    (value.match(/<\/thinking>/g) || []).length
  return openCount > closeCount
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
  if (!hasUnclosedThinkTag(value)) return value
  return value + THINK_CLOSE_TAG
}

const extractThinkContentStrict = (
  raw: string,
): { content: string; thinking: string } => {
  if (!raw) {
    return { content: '', thinking: '' }
  }

  const openMatch = raw.match(/<think(?:ing)?>/i)
  if (!openMatch || openMatch.index === undefined) {
    return { content: normalizeMainContent(raw), thinking: '' }
  }

  const openStart = openMatch.index
  const openEnd = openStart + openMatch[0].length
  const closeMatch = raw.slice(openEnd).match(/<\/think(?:ing)?>/i)

  // Strict mode: once think starts, all following text stays in thinking
  // until an explicit closing marker is received.
  if (!closeMatch || closeMatch.index === undefined) {
    const contentBeforeThink = raw.slice(0, openStart)
    const thinking = raw.slice(openEnd)
    return {
      content: normalizeMainContent(contentBeforeThink).trim(),
      thinking: thinking.trim(),
    }
  }

  const closeStart = openEnd + closeMatch.index
  const closeEnd = closeStart + closeMatch[0].length
  const contentBeforeThink = raw.slice(0, openStart)
  const thinking = raw.slice(openEnd, closeStart)
  const contentAfterThink = raw.slice(closeEnd)

  return {
    content: normalizeMainContent(
      `${contentBeforeThink}${contentAfterThink}`,
    ).trim(),
    thinking: thinking.trim(),
  }
}

// The final frame carries the authoritative full answer with citation markers
// inserted mid-text, so it replaces the accumulated deltas instead of being
// merged into them. Closed reasoning the final text omits is kept.
const replaceWithFinalAnswer = (
  accumulated: string,
  finalAnswer: string,
): string => {
  if (
    THINK_OPEN_PATTERN.test(finalAnswer) ||
    hasUnclosedThinkTag(accumulated)
  ) {
    return finalAnswer
  }

  const { thinking } = extractThinkContentStrict(accumulated)
  return thinking
    ? `${THINK_OPEN_TAG}${thinking}${THINK_CLOSE_TAG}${finalAnswer}`
    : finalAnswer
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
  // A failed answer keeps its split; reasoning is not promoted to an answer.
  if (state.phase === 'failed') return state
  if (state.content.trim() || !state.thinking.trim()) return state

  const splitThinking = state.thinking.match(/^([\s\S]*?)\n\n+(\S[\s\S]*)$/)
  if (!splitThinking) return state

  return {
    ...state,
    content: splitThinking[2].trim(),
    thinking: splitThinking[1].trim(),
  }
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
