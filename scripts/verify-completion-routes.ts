/** Run the actual domain clients against caller-owned scratch HTTP endpoints. */
import assert from 'node:assert/strict'
import { agentAPI } from '../src/api/agent'
import { searchAPI } from '../src/api/search'
import { assertSSEResponse } from '../src/lib/streaming'

const base = process.env.COMPLETION_ACCEPTANCE_BASE
let token = process.env.COMPLETION_ACCEPTANCE_TOKEN
const id = process.env.COMPLETION_ACCEPTANCE_ID
const mode = process.env.COMPLETION_ACCEPTANCE_MODE
assert.ok(base && token && id)
Object.defineProperty(globalThis, 'localStorage', {
  value: { getItem: () => token },
  configurable: true,
})
const realFetch = globalThis.fetch
const paths: string[] = []
// Domain clients retain the exact path/body/headers; only the origin is scoped
// to the temporary listener created by the integration fixture.
globalThis.fetch = ((url, init) => {
  const path = new URL(String(url)).pathname
  paths.push(path)
  return realFetch(`${base}${path}`, init)
}) as typeof fetch

if (mode === 'agent') {
  let sessionId: string | undefined
  for (const query of ['web first', 'web continued']) {
    const response = await agentAPI.runAgentSession({
      id,
      query,
      mode: 'published',
      session_id: sessionId,
    })
    await assertSSEResponse(response)
    const text = await response.text()
    assert.match(text, /published web reply/)
    assert.match(text, /\[DONE\]/)
    const events = text
      .split('\n')
      .filter((line) => line.startsWith('data:') && !line.includes('[DONE]'))
      .map((line) => JSON.parse(line.slice(5)))
    const received = events.find((event) => event.session_id)?.session_id
    assert.ok(received)
    if (sessionId) assert.equal(received, sessionId)
    sessionId = received
  }
  token = 'invalid-acceptance-token'
  await assert.rejects(
    assertSSEResponse(
      await agentAPI.runAgent({ id, query: 'denied', mode: 'published' }),
    ),
  )
  assert.ok(paths.every((path) => path === '/api/v1/agents/chat/completions'))
  console.log(JSON.stringify({ session_id: sessionId, paths }))
} else {
  const response = await searchAPI.askStream({
    search_id: id,
    question: 'web search',
    kb_ids: [],
  })
  await assertSSEResponse(response)
  assert.match(await response.text(), /Answer/)
  token = 'invalid-acceptance-token'
  await assert.rejects(
    assertSSEResponse(
      await searchAPI.askStream({
        search_id: id,
        question: 'denied',
        kb_ids: [],
      }),
    ),
  )
  assert.ok(
    paths.every((path) => path === `/api/v1/searches/${id}/completions`),
  )
  console.log(JSON.stringify({ paths }))
}
