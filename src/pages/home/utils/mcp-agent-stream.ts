import type { MCPChatServiceRequest } from '@/api/mcp-chat-service'
import {
  assertSSEResponse,
  consumeAgentTimelineEvent,
  createInitialAgentTimelineState,
  normalizeAgentSSEPayload,
  readSSEStream,
  type AgentTimelineState,
} from '@/lib/streaming'

interface StreamMCPAgentChatOptions {
  request: MCPChatServiceRequest
  signal: AbortSignal
  onState: (state: AgentTimelineState) => void
}

/**
 * MCP agent chat SSE, on the shared streaming runtime (ARCH-1 phase 2).
 * parseErrorMode is 'throw' to keep this surface's original behavior: a
 * malformed frame aborts the run and surfaces an error to the caller.
 */
export const streamMCPAgentChat = async ({
  request,
  signal,
  onState,
}: StreamMCPAgentChatOptions) => {
  const authToken = localStorage.getItem('auth_token')
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/v1/llm/enhanced_chat_sse`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify(request),
      signal,
    },
  )

  await assertSSEResponse(response)

  let timelineState = createInitialAgentTimelineState()

  await readSSEStream(response, {
    signal,
    parseErrorMode: 'throw',
    onEvent: (raw) => {
      const events = normalizeAgentSSEPayload(raw)
      if (events.length === 0) return

      for (const event of events) {
        timelineState = consumeAgentTimelineEvent(timelineState, event)
      }

      onState(timelineState)
    },
  })
}
