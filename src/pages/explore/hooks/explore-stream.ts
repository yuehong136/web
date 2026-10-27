import {
  assertSSEResponse,
  consumeStreamingAnswerChunk,
  createInitialStreamingAnswerState,
  getServerRunPhase,
  isRunTerminal,
  readSSEStream,
  transitionRunPhase,
  type RunPhase,
  type StreamingAnswerState,
} from '@/lib/streaming'
import {
  extractReferencesFromSSEData,
  type ReferenceChunk,
} from '@/utils/reference-replacer'

export interface ExploreStreamState {
  answer: StreamingAnswerState
  references: ReferenceChunk[]
  phase: RunPhase
  runId?: string
}

export const createExploreStreamState = (): ExploreStreamState => ({
  answer: createInitialStreamingAnswerState(),
  references: [],
  phase: 'running',
})

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** A connection belongs to one message; the first observed terminal wins. */
export function consumeExploreStreamEvent(
  state: ExploreStreamState,
  event: unknown,
): ExploreStreamState {
  if (isRunTerminal(state.phase) || !isRecord(event)) return state
  const payload = isRecord(event.data) ? event.data : event
  const eventRunId = payload.run_id ?? event.run_id
  const runId = typeof eventRunId === 'string' ? eventRunId : undefined
  if (state.runId && runId && state.runId !== runId) return state
  const code = event.retcode ?? event.code
  const eventType = payload.type ?? event.type
  const serverPhase = getServerRunPhase(String(eventType))
  const chunk = consumeStreamingAnswerChunk(state.answer, event)
  const phase =
    (typeof code === 'number' && code !== 0) ||
    eventType === 'error' ||
    chunk.nextState.phase === 'failed'
      ? 'failed'
      : (serverPhase ??
        (chunk.nextState.phase === 'completed' ? 'completed' : state.phase))
  const references = extractReferencesFromSSEData(payload)
  return {
    answer: chunk.nextState,
    references: references.length ? references : state.references,
    phase,
    runId: state.runId ?? runId,
  }
}

/** EOF says only that reception ended; it cannot manufacture completion. */
export async function consumeExploreResponse(
  response: Response,
  signal: AbortSignal,
  onState: (state: ExploreStreamState) => void,
): Promise<ExploreStreamState> {
  let state = createExploreStreamState()
  const publish = (next: ExploreStreamState) => {
    state = next
    onState(state)
  }
  try {
    await assertSSEResponse(response)
    const end = await readSSEStream<unknown>(response, {
      signal,
      onEvent: (event) => {
        const next = consumeExploreStreamEvent(state, event)
        if (next !== state) publish(next)
      },
    })
    publish({
      ...state,
      phase: transitionRunPhase(
        state.phase,
        end.reason === 'aborted' ? 'locallyStopped' : 'interrupted',
      ),
    })
  } catch {
    publish({
      ...state,
      phase: transitionRunPhase(
        state.phase,
        signal.aborted ? 'locallyStopped' : 'failed',
      ),
    })
  }
  return state
}
