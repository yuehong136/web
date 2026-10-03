import { act } from 'react'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { APIError } from '@/api/client-types'
import { setProductLanguage } from '@/locales/i18n'
import enAgent from '@/locales/en-US/agent'
import zhAgent from '@/locales/zh-CN/agent'
import {
  api,
  agentKeys,
  mountChat,
  resetAPI,
  session,
  stream,
  waitForState,
  type ChatHarness,
} from './explore-chat-test-harness'
let harness: ChatHarness
beforeEach(resetAPI)
afterEach(async () => harness?.dispose())

for (const language of ['en-US', 'zh-CN'] as const) {
  for (const phase of ['create', 'run'] as const) {
    it(`${phase} refusal preserves typed feedback in ${language}`, async () => {
      await setProductLanguage(language)
      harness = await mountChat({
        id: phase === 'create' ? '' : 'A',
        isNew: phase === 'create',
      })
      if (phase === 'create')
        api.createSession.mockRejectedValueOnce(
          new APIError(403, 'grant_not_found', 'private detail'),
        )
      else
        api.runAgentSession.mockResolvedValueOnce(
          Response.json(
            {
              retcode: 104,
              data: false,
              error_code: 'grant_not_found',
              retmsg: 'private detail',
            },
            { status: 403 },
          ),
        )
      const run = await harness.start()
      await act(async () => run.pending)
      const expected = (language === 'en-US' ? enAgent : zhAgent).agent.runtime
        .authorization.grantRequired
      expect(harness.chat.lastError).toBe(expected)
      expect(
        harness.chat.messages.map((m) => m.content).join(''),
      ).not.toContain('private')
      if (phase === 'create') expect(api.runAgentSession).not.toHaveBeenCalled()
    })
  }
}

function dsl(name: string) {
  return {
    components: {
      begin: {
        obj: {
          component_name: 'Begin',
          params: {
            mode: 'task',
            inputs: {
              [name]: { name, type: 'line', optional: true, value: '' },
            },
          },
        },
        downstream: [],
        upstream: [],
      },
    },
    path: [],
    history: [],
  }
}
it('published creation previews published inputs and passes mode only to creation', async () => {
  api.fetchVersions.mockResolvedValue([
    { id: 'pub', release: true, create_time: 2 },
    { id: 'draft', release: false, create_time: 3 },
  ])
  api.fetchVersion.mockResolvedValue({
    id: 'canvas',
    dsl: dsl('published-input'),
  })
  harness = await mountChat({ id: '', isNew: true, mode: 'published' })
  await waitForState(() => expect(harness.chat.canSend).toBe(true))
  expect(harness.chat.beginInputs.map((input) => input.key)).toEqual([
    'published-input',
  ])
  api.createSession.mockResolvedValueOnce(session('created'))
  const body = stream()
  api.runAgentSession.mockResolvedValueOnce(body.response)
  let pending!: Promise<void>
  await act(async () => {
    pending = harness.chat.handleParametersOk([])
    await Promise.resolve()
  })
  await waitForState(() => expect(api.runAgentSession).toHaveBeenCalled())
  // The stream remains open; no release override may accompany the new session ID.
  expect(api.createSession).toHaveBeenCalledWith('canvas', {
    name: expect.any(String),
    mode: 'published',
  })
  expect(api.runAgentSession.mock.calls[0]?.[0].release).toBeUndefined()
  expect(api.runAgentSession.mock.calls[0]?.[0].session_id).toBe('created')
  body.end()
  await act(async () => pending)
})
it('saved-session input definitions come from the session rather than today’s draft', async () => {
  harness = await mountChat({ cached: [] })
  api.fetchSession.mockResolvedValue({
    ...session('A'),
    dsl: dsl('original-input'),
  })
  await harness.queryClient.invalidateQueries({
    queryKey: agentKeys.session('canvas', 'A'),
  })
  await waitForState(() =>
    expect(harness.chat.beginInputs.map((input) => input.key)).toEqual([
      'original-input',
    ]),
  )
  expect(api.fetchVersions).not.toHaveBeenCalled()
})
it('missing published version blocks creation instead of falling back to draft', async () => {
  api.fetchVersions.mockResolvedValue([])
  harness = await mountChat({ id: '', isNew: true, mode: 'published' })
  await waitForState(() => expect(harness.chat.sessionError).toBe(true))
  expect(harness.chat.canSend).toBe(false)
  await act(async () => harness.chat.handleSendMessage({ content: 'hello' }))
  expect(api.createSession).not.toHaveBeenCalled()
})
