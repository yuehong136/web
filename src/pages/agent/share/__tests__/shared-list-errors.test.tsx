import { act, useLayoutEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createInstance } from 'i18next'
import { I18nextProvider } from 'react-i18next'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { agentAPI } from '@/api/agent'
import enAgent from '@/locales/en-US/agent'
import zhAgent from '@/locales/zh-CN/agent'
import { useSharedAgentRunner } from '../use-shared-agent-runner'

let root: Root
let container: HTMLDivElement
let runner: ReturnType<typeof useSharedAgentRunner>
const buildInputs = () => ({})
const i18n = createInstance()
function Harness() {
  const currentRunner = useSharedAgentRunner({
    agentId: 'list-agent',
    betaToken: 'fixture',
    buildInputs,
  })
  useLayoutEffect(() => {
    runner = currentRunner
  }, [currentRunner])
  return (
    <div>
      {currentRunner.lastError}
      {currentRunner.messages.map((message) => message.content).join('')}
    </div>
  )
}
beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
async function mount(language = 'en-US') {
  await i18n.init({
    lng: language,
    resources: {
      'en-US': { translation: enAgent },
      'zh-CN': { translation: zhAgent },
    },
  })
  await act(async () =>
    root.render(
      <I18nextProvider i18n={i18n}>
        <Harness />
      </I18nextProvider>,
    ),
  )
}
function response(frames: unknown[]) {
  return new Response(
    frames.map((frame) => `data:${JSON.stringify(frame)}\n\n`).join(''),
    { headers: { 'Content-Type': 'text/event-stream' } },
  )
}
for (const frame of [
  { code: 100, message: 'private strict range error', data: false },
  {
    event: 'error',
    session_id: 'list-session',
    data: { error: 'private strict range error' },
  },
  {
    event: 'workflow_finished',
    data: { outputs: { _ERROR: 'private strict range error' } },
  },
]) {
  it.each(['en-US', 'zh-CN'])(
    `share consumes list failure ${JSON.stringify(frame)} safely in %s`,
    async (language) => {
      await mount(language)
      vi.spyOn(agentAPI, 'runExternalAgent').mockResolvedValue(
        response([frame]),
      )
      await act(async () => runner.submit({ query: 'list', values: {} }))
      const expected = (language === 'en-US' ? enAgent : zhAgent).agent.runtime
        .runFailed
      expect(runner.lastError).toBe(expected)
      expect(runner.messages.at(-1)?.error).toBe(expected)
      expect(runner.messages.at(-1)?.content).toBe(expected)
      expect(runner.isRunning).toBe(false)
      expect(container.textContent).not.toContain('private')
    },
  )
}
it('lenient empty list is a successful result', async () => {
  await mount()
  vi.spyOn(agentAPI, 'runExternalAgent').mockResolvedValue(
    response([
      { event: 'message', session_id: 'list-session', data: { content: '[]' } },
      { event: 'message_end', session_id: 'list-session', data: {} },
    ]),
  )
  await act(async () => runner.submit({ query: 'zero', values: {} }))
  expect(runner.messages.at(-1)?.content).toBe('[]')
  expect(runner.messages.at(-1)?.error).toBeUndefined()
  expect(runner.lastError).toBeUndefined()
})
it('HTTP failure keeps private error text out of share feedback', async () => {
  await mount()
  vi.spyOn(agentAPI, 'runExternalAgent').mockRejectedValue(
    new Error('private server error'),
  )
  await act(async () => runner.submit({ query: 'list', values: {} }))
  expect(runner.lastError).toBe(enAgent.agent.runtime.runFailed)
  expect(container.textContent).not.toContain('private')
})

it.each(['en-US', 'zh-CN'])(
  'share shows fixed delegation feedback in %s',
  async (language) => {
    await mount(language)
    vi.spyOn(agentAPI, 'runExternalAgent').mockResolvedValue(
      Response.json(
        {
          retcode: 104,
          data: false,
          error_code: 'token_issuance_failed',
          retmsg: 'private issuer failure',
        },
        { status: 503 },
      ),
    )
    await act(async () => runner.submit({ query: 'tool', values: {} }))
    const expected = (language === 'en-US' ? enAgent : zhAgent).agent.runtime
      .authorization.serviceUnavailable
    expect(runner.lastError).toBe(expected)
    expect(runner.isRunning).toBe(false)
    expect(container.textContent).not.toContain('private')
  },
)
