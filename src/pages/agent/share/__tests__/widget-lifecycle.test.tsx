import { act, StrictMode, useLayoutEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createInstance } from 'i18next'
import { I18nextProvider } from 'react-i18next'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { agentAPI } from '@/api/agent'
import enAgent from '@/locales/en-US/agent'
import zhAgent from '@/locales/zh-CN/agent'
import { useSharedAgentRunner } from '../use-shared-agent-runner'
import {
  WidgetLauncher,
  WidgetStandalonePreview,
  useTransparentDocument,
} from '../widget-shell'

let root: Root
let container: HTMLDivElement
const i18n = createInstance()
const postMessage = vi.fn()
let signal: AbortSignal | undefined
let pending: Promise<void> | undefined
let mounts: number
let cleanups: number
const buildInputs = () => ({})

function ChatProbe({ agentId = 'fixture' }: { agentId?: string }) {
  const runner = useSharedAgentRunner({
    agentId,
    betaToken: 'fixture-token',
    release: true,
    userId: 'fixture-user',
    buildInputs,
  })
  useLayoutEffect(() => {
    mounts += 1
    return () => {
      cleanups += 1
    }
  }, [])
  return (
    <div data-testid="chat">
      <textarea aria-label="Draft" defaultValue="" />
      <button
        onClick={() => {
          pending = runner.submit({ query: 'hello', values: {} })
        }}
      >
        Send fixture
      </button>
      <span>{runner.isRunning ? 'running' : 'idle'}</span>
    </div>
  )
}
function Preview() {
  useTransparentDocument()
  return (
    <WidgetStandalonePreview>
      <ChatProbe />
    </WidgetStandalonePreview>
  )
}
async function click(name: string, index = 0) {
  const buttons = Array.from(container.querySelectorAll('button')).filter(
    (button) =>
      button.getAttribute('aria-label') === name || button.textContent === name,
  )
  expect(buttons.length).toBeGreaterThan(index)
  await act(async () => buttons[index].click())
}
beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  mounts = 0
  cleanups = 0
  signal = undefined
  pending = undefined
  postMessage.mockClear()
  vi.spyOn(window, 'parent', 'get').mockReturnValue({
    postMessage,
  } as unknown as Window)
  vi.spyOn(agentAPI, 'runExternalAgent').mockImplementation(
    (_payload, options) => {
      signal = options?.signal
      return new Promise((_resolve, reject) => {
        signal?.addEventListener('abort', () =>
          reject(new DOMException('Aborted', 'AbortError')),
        )
      })
    },
  )
  await i18n.init({
    lng: 'en-US',
    resources: {
      'en-US': { translation: enAgent },
      'zh-CN': { translation: zhAgent },
    },
  })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => {
    root.unmount()
    await pending
  })
  container.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
async function render(children: React.ReactNode) {
  await act(async () =>
    root.render(<I18nextProvider i18n={i18n}>{children}</I18nextProvider>),
  )
}

it.each(['en-US', 'zh-CN'])(
  'opens locally, preserves the live conversation on close and aborts on unmount in %s',
  async (language) => {
    await i18n.changeLanguage(language)
    const labels = (language === 'en-US' ? enAgent : zhAgent).agent.share
    await render(<Preview />)
    expect(container.querySelector('[data-testid="chat"]')).toBeNull()
    expect(agentAPI.runExternalAgent).not.toHaveBeenCalled()
    await click(labels.openWidget)
    expect(container.querySelector('[hidden]')).toBeNull()
    expect(mounts).toBe(1)
    const draft = container.querySelector('textarea')!
    draft.value = 'unsent draft'
    await click('Send fixture')
    expect(signal?.aborted).toBe(false)
    expect(agentAPI.runExternalAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'fixture',
        betaToken: 'fixture-token',
        mode: 'published',
        user_id: 'fixture-user',
      }),
      expect.objectContaining({ signal }),
    )
    // The header closes the panel; reopening keeps the same runtime and draft.
    await click(labels.closeWidget)
    expect(container.querySelector('[hidden]')).not.toBeNull()
    expect(cleanups).toBe(0)
    expect(signal?.aborted).toBe(false)
    await click(labels.openWidget)
    expect(container.querySelector('textarea')).toBe(draft)
    expect(draft.value).toBe('unsent draft')
    expect(mounts).toBe(1)
    // The launcher's close button also hides the panel.
    await click(labels.closeWidget, 1)
    expect(container.querySelector('[hidden]')).not.toBeNull()
    expect(postMessage).not.toHaveBeenCalled()
    await act(async () => root.render(null))
    await pending
    expect(signal?.aborted).toBe(true)
    expect(cleanups).toBe(1)
  },
)

it('preserves embedded creation and toggle messages, including every access parameter', async () => {
  const originalUrl = window.location.href
  window.history.replaceState(
    null,
    '',
    '/chats/widget?shared_id=fixture&auth=fixture-token&mode=master&locale=zh-CN&release=true&streaming=true&userId=user&data_mode=master#fragment',
  )
  try {
    await render(<WidgetLauncher />)
    const expected = new URL(window.location.href)
    expected.searchParams.set('mode', 'window')
    expect(postMessage).toHaveBeenCalledWith(
      { type: 'CREATE_CHAT_WINDOW', src: expected.href },
      '*',
    )
    expect(container.querySelector('[data-testid="chat"]')).toBeNull()
    await click(enAgent.agent.share.openWidget)
    expect(postMessage).toHaveBeenLastCalledWith(
      { type: 'TOGGLE_CHAT', isOpen: true },
      '*',
    )
    await click(enAgent.agent.share.closeWidget)
    expect(postMessage).toHaveBeenLastCalledWith(
      { type: 'TOGGLE_CHAT', isOpen: false },
      '*',
    )
    const count = postMessage.mock.calls.length
    await act(async () => root.render(null))
    expect(postMessage).toHaveBeenCalledTimes(count)
    expect(agentAPI.runExternalAgent).not.toHaveBeenCalled()
  } finally {
    window.history.replaceState(null, '', originalUrl)
  }
})

it('restores document styles after StrictMode cleanup and actual unmount', async () => {
  const original = {
    html: document.documentElement.style.background,
    body: document.body.style.background,
    margin: document.body.style.margin,
  }
  document.documentElement.style.background = 'red'
  document.body.style.background = 'blue'
  document.body.style.margin = '12px'
  try {
    await render(
      <StrictMode>
        <Preview />
      </StrictMode>,
    )
    expect(document.documentElement.style.background).toBe('transparent')
    expect(document.body.style.background).toBe('transparent')
    expect(document.body.style.margin).toBe('0px')
    await act(async () => root.render(null))
    expect(document.documentElement.style.background).toBe('red')
    expect(document.body.style.background).toBe('blue')
    expect(document.body.style.margin).toBe('12px')
  } finally {
    document.documentElement.style.background = original.html
    document.body.style.background = original.body
    document.body.style.margin = original.margin
  }
})

it('aborts the old subscription when the share identity changes', async () => {
  await render(<ChatProbe />)
  await click('Send fixture')
  await act(async () => {
    root.render(
      <I18nextProvider i18n={i18n}>
        <ChatProbe agentId="next" />
      </I18nextProvider>,
    )
  })
  await pending
  expect(signal?.aborted).toBe(true)
})
