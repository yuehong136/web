import type { RunAgentPayload } from '@/types/agent'

/** Translate UI intent once; executable identity always comes from the server. */
export function buildAgentRunBody(payload: RunAgentPayload) {
  const mode =
    payload.mode ??
    (payload.release === true ||
    payload.release === 'true' ||
    payload.release === '1'
      ? 'published'
      : 'draft')
  return {
    query: payload.query || '',
    session_id: payload.session_id,
    files: payload.files || [],
    inputs: payload.inputs || {},
    ...(payload.a2ui ? { a2ui: payload.a2ui } : {}),
    ...(payload.metadata ? { metadata: payload.metadata } : {}),
    // An existing session retains its immutable origin, regardless of UI mode.
    ...(!payload.session_id ? { release: mode === 'published' } : {}),
    ...(payload.user_id ? { user_id: payload.user_id } : {}),
  }
}
