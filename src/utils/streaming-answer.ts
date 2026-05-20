const THINK_OPEN_TAG = '<think>'
const THINK_CLOSE_TAG = '</think>'

export interface StreamingAnswerState {
  fullAnswer: string
  content: string
  thinking: string
}

export interface StreamingAnswerChunkResult {
  nextState: StreamingAnswerState
  isDone: boolean
  isFinal: boolean
  payload: unknown
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

export const createInitialStreamingAnswerState = (): StreamingAnswerState => ({
  fullAnswer: '',
  content: '',
  thinking: '',
})

export const finalizeStreamingAnswerState = (
  state: StreamingAnswerState,
): StreamingAnswerState => {
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
      nextState: previousState,
      isDone: true,
      isFinal: true,
      payload,
    }
  }

  const retcode =
    typeof rawChunk.retcode === 'number'
      ? rawChunk.retcode
      : typeof rawChunk.code === 'number'
        ? rawChunk.code
        : 0

  if (retcode !== 0) {
    return {
      nextState: previousState,
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

    if (answer) {
      nextFullAnswer = mergeAnswerText(nextFullAnswer, answer)
    }

    isFinal = streamPayload.final === true
  }

  const think = extractThinkContentStrict(nextFullAnswer)

  return {
    nextState: {
      fullAnswer: nextFullAnswer,
      content: think.content,
      thinking: think.thinking,
    },
    isDone: false,
    isFinal,
    payload,
  }
}
