import { EventSourceParserStream } from 'eventsource-parser/stream'
import type { MCPChatServiceRequest } from '@/api/mcp-chat-service'
import {
  consumeAgentTimelineEvent,
  createInitialAgentTimelineState,
  type AgentTimelineState,
} from '@/utils/agent-timeline'
import { normalizeAgentSSEPayload } from '@/utils/agent-timeline-events'

interface StreamMCPAgentChatOptions {
  request: MCPChatServiceRequest
  signal: AbortSignal
  onState: (state: AgentTimelineState) => void
}

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

  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
  if (!response.body) throw new Error('Response body is not readable')

  const reader = response.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new EventSourceParserStream())
    .getReader()
  let timelineState = createInitialAgentTimelineState()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    if (signal.aborted) {
      reader.cancel()
      break
    }

    const jsonStr = value?.data
    if (!jsonStr) continue

    const raw = JSON.parse(jsonStr)
    const events = normalizeAgentSSEPayload(raw)
    if (events.length === 0) continue

    for (const event of events) {
      timelineState = consumeAgentTimelineEvent(timelineState, event)
    }

    onState(timelineState)
  }
}
