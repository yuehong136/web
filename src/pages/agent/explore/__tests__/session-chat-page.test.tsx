import { act } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { setProductLanguage } from '@/locales/i18n'
import {
  api,
  deferred,
  mountPage,
  resetAPI,
  session,
  stream,
  waitForState,
} from './explore-chat-test-harness'
import type { AgentSession } from '@/types/agent'

let page: Awaited<ReturnType<typeof mountPage>>
beforeEach(async () => {
  resetAPI()
  await setProductLanguage('en-US')
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
})
afterEach(async () => {
  await page?.dispose()
  vi.unstubAllGlobals()
})
function button(name: string) {
  const element = Array.from(
    page.container.querySelectorAll<HTMLElement>('button,[role=button]'),
  ).find(
    (item) =>
      item.textContent?.trim() === name ||
      item.querySelector('p')?.textContent === name ||
      item.getAttribute('aria-label') === name,
  )
  if (!element) throw new Error(`Missing button ${name}`)
  return element
}
async function type(value: string) {
  const textarea = page.container.querySelector('textarea')
  if (!textarea) throw new Error('Missing composer')
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      'value',
    )?.set?.call(textarea, value)
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

it('actual Explore page hides the composer during B load and shows only B history before sending', async () => {
  page = await mountPage(['A'])
  await waitForState(() => expect(button('B')).toBeTruthy())
  await type('unsent A draft')
  const history = deferred<AgentSession>()
  api.fetchSession.mockReturnValueOnce(history.promise)
  await act(async () => button('B').click())
  expect(page.location).toBe('?sessionId=B')
  expect(page.container.textContent).toContain('Loading session')
  expect(page.container.textContent).not.toContain('A history')
  expect(page.container.querySelector('textarea')).toBeNull()
  await act(async () => history.resolve(session('B')))
  await waitForState(() =>
    expect(page.container.querySelector('textarea')).not.toBeNull(),
  )
  expect(page.container.querySelector('textarea')?.value).toBe('')
  expect(page.container.textContent).toContain('B history')
  const body = stream()
  api.runAgentSession.mockResolvedValueOnce(body.response)
  await type('B message')
  await act(async () => button('发送').click())
  expect(api.runAgentSession.mock.calls[0]?.[0].session_id).toBe('B')
  body.end()
  await waitForState(() =>
    expect(page.container.querySelector('textarea')?.disabled).toBe(false),
  )
})

it('actual error state retries history and switches its fixed feedback between Chinese and English', async () => {
  page = await mountPage(['A'])
  await waitForState(() => expect(button('B')).toBeTruthy())
  api.fetchSession.mockRejectedValueOnce(new Error('private server details'))
  await act(async () => button('B').click())
  await waitForState(() =>
    expect(page.container.textContent).toContain('Failed to load session'),
  )
  expect(page.container.textContent).not.toContain('private server details')
  expect(page.container.querySelector('textarea')).toBeNull()
  await act(async () => setProductLanguage('zh-CN'))
  expect(page.container.textContent).toContain('会话加载失败')
  await act(async () => setProductLanguage('en-US'))
  expect(page.container.textContent).toContain('Failed to load session')
  api.fetchSession.mockResolvedValueOnce(session('B'))
  await act(async () => button('Retry').click())
  await waitForState(() =>
    expect(page.container.querySelector('textarea')).not.toBeNull(),
  )
  expect(page.container.textContent).toContain('B history')
})

it('old A composer completion cannot clear a draft typed in actual B page', async () => {
  page = await mountPage()
  await waitForState(() => expect(button('B')).toBeTruthy())
  const a = stream()
  api.runAgentSession.mockResolvedValueOnce(a.response)
  await type('A question')
  await act(async () => button('发送').click())
  await act(async () => button('B').click())
  await type('B draft')
  await act(async () => {
    a.emit({
      event: 'message',
      session_id: 'A',
      data: { content: 'old answer' },
    })
    a.end()
  })
  await waitForState(() =>
    expect(page.container.querySelector('textarea')?.value).toBe('B draft'),
  )
  expect(page.location).toBe('?sessionId=B')
  expect(page.container.textContent).toContain('B history')
  expect(page.container.textContent).not.toContain('old answer')
})

it('actual new-session promotion retains the stream and continues with the created ID', async () => {
  page = await mountPage()
  await waitForState(() => expect(button('B')).toBeTruthy())
  api.createSession.mockResolvedValueOnce(session('created'))
  const first = stream()
  api.runAgentSession.mockResolvedValueOnce(first.response)
  await act(async () => button('新建').click())
  await type('first new message')
  await act(async () => button('发送').click())
  await waitForState(() => expect(page.location).toBe('?sessionId=created'))
  expect(api.runAgentSession.mock.calls[0]?.[0].session_id).toBe('created')
  const signal = api.runAgentSession.mock.calls[0]?.[1].signal as AbortSignal
  expect(signal.aborted).toBe(false)
  await act(async () =>
    first.emit({
      event: 'message',
      session_id: 'created',
      data: { content: 'new answer' },
    }),
  )
  expect(page.container.textContent).toContain('first new message')
  expect(page.container.textContent).toContain('new answer')
  await act(async () => first.end())
  await waitForState(() =>
    expect(page.container.querySelector('textarea')?.disabled).toBe(false),
  )
  const second = stream()
  api.runAgentSession.mockResolvedValueOnce(second.response)
  await type('continue new session')
  await act(async () => button('发送').click())
  expect(api.createSession).toHaveBeenCalledTimes(1)
  expect(api.runAgentSession.mock.calls[1]?.[0].session_id).toBe('created')
  await act(async () => second.end())
})

it.each(['B', '新建'])(
  'late creation cannot promote the page after selecting %s',
  async (target) => {
    page = await mountPage()
    await waitForState(() => expect(button('B')).toBeTruthy())
    const obsolete = deferred<AgentSession>()
    api.createSession.mockReturnValueOnce(obsolete.promise)
    await act(async () => button('新建').click())
    await type('old new question')
    await act(async () => button('发送').click())
    expect(api.createSession).toHaveBeenCalledTimes(1)
    await act(async () => button(target).click())
    await act(async () => obsolete.resolve(session('obsolete')))
    expect(api.runAgentSession).not.toHaveBeenCalled()
    expect(page.location).toBe(target === 'B' ? '?sessionId=B' : '?isNew=true')
    expect(page.container.textContent).not.toContain('old new question')
    if (target === '新建') {
      api.createSession.mockResolvedValueOnce(session('fresh'))
      const next = stream()
      api.runAgentSession.mockResolvedValueOnce(next.response)
      await type('fresh new question')
      await act(async () => button('发送').click())
      expect(api.createSession).toHaveBeenCalledTimes(2)
      expect(api.runAgentSession.mock.calls[0]?.[0].session_id).toBe('fresh')
      await act(async () => next.end())
    }
  },
)

it('retains frames and completion queued before new-session URL promotion in StrictMode', async () => {
  page = await mountPage()
  await waitForState(() => expect(button('B')).toBeTruthy())
  api.createSession.mockResolvedValueOnce(session('fast-created'))
  const body = stream()
  body.emit({
    event: 'message',
    session_id: 'fast-created',
    data: { content: 'fast answer' },
  })
  body.emit({
    event: 'workflow_finished',
    session_id: 'fast-created',
    data: {},
  })
  body.end()
  api.runAgentSession.mockResolvedValueOnce(body.response)
  await act(async () => button('新建').click())
  await type('fast new question')
  await act(async () => button('发送').click())
  await waitForState(() =>
    expect(page.location).toBe('?sessionId=fast-created'),
  )
  await waitForState(() =>
    expect(page.container.textContent).toContain('fast answer'),
  )
  expect(page.container.textContent).toContain('fast new question')
  expect(page.container.querySelector('textarea')?.disabled).toBe(false)
})
