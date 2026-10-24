/** Wire shapes from api/apps/llm_app.py: enhanced_chat_service_sse and its adapter. */
export const structuredChatFixtures = {
  partial: [
    {
      retcode: 0,
      retmsg: '',
      data: { type: 'text', content: 'Partial answer' },
    },
  ],
  completed: [
    {
      retcode: 0,
      retmsg: '',
      data: { type: 'tool_start', content: 'Starting tool analysis...' },
    },
    {
      retcode: 0,
      retmsg: '',
      data: {
        type: 'tool_call',
        content: {
          tool_name: 'lookup',
          arguments: { q: 'fixture' },
          call_id: 'call_1',
        },
      },
    },
    {
      retcode: 0,
      retmsg: '',
      data: {
        type: 'tool_result',
        content: {
          tool_name: 'lookup',
          result: 0,
          call_id: 'call_1',
          success: true,
        },
      },
    },
    {
      retcode: 0,
      retmsg: '',
      data: {
        type: 'tool_end',
        content: { total_calls: 1, summary: 'Used 1 tool(s)' },
      },
    },
    {
      retcode: 0,
      retmsg: '',
      data: { type: 'text', content: 'Complete answer' },
    },
    { retcode: 0, retmsg: 'Stream completed', data: true },
  ],
  failed: [
    {
      retcode: 0,
      retmsg: '',
      data: { type: 'text', content: 'Partial answer' },
    },
    {
      retcode: 500,
      retmsg: 'private-upstream-detail',
      data: { type: 'error', content: { error: 'private-upstream-detail' } },
    },
  ],
} as const

export const encodeSSE = (events: readonly unknown[]): string =>
  events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join('')

export const fixtureResponse = (events: readonly unknown[]): Response =>
  new Response(encodeSSE(events), {
    headers: { 'content-type': 'text/event-stream' },
  })
