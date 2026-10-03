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
function button(name: string, scope: ParentNode = page.container) {
  const element = Array.from(
    scope.querySelectorAll<HTMLElement>('button,[role=button]'),
  ).find(
    (item) =>
      item.textContent?.trim() === name ||
      item.querySelector('p')?.textContent === name ||
      item.querySelector('span')?.textContent === name ||
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

async function changeInput(input: HTMLInputElement | null, value: string) {
  if (!input) throw new Error('Missing input')
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )?.set?.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

function labeledInput(name: string) {
  const label = Array.from(
    document.body.querySelectorAll<HTMLLabelElement>('label'),
  ).find((element) => element.textContent === name)
  return label?.control instanceof HTMLInputElement ? label.control : null
}

async function selectOption(label: string, value: string) {
  await act(async () => button(label, document.body).click())
  const option = Array.from(
    document.body.querySelectorAll<HTMLButtonElement>(
      '[data-select-content] button',
    ),
  ).find((element) => element.textContent === value)
  if (!option) throw new Error(`Missing ${label} option ${value}`)
  await act(async () =>
    option.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true })),
  )
}

async function openDeleteConfirmation(name: string) {
  await act(async () => button(`Options for “${name}”`).click())
  await act(async () => button('Delete conversation', document.body).click())
  const dialog = document.body.querySelector('[role="alertdialog"]')
  if (!dialog) throw new Error('Missing deletion confirmation')
  return dialog
}

async function confirmDelete(name: string) {
  const dialog = await openDeleteConfirmation(name)
  await act(async () => button('Delete conversation', dialog).click())
}

async function escapePopup() {
  await act(async () =>
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    ),
  )
}

async function deleteOtherSession() {
  api.fetchSessions.mockResolvedValue({
    sessions: [session('A')],
    total: 1,
  })
  await confirmDelete('B')
  await waitForState(() =>
    expect(api.deleteSession).toHaveBeenCalledWith('canvas', 'B'),
  )
}

it('deleting another conversation preserves the selected conversation and its composer draft', async () => {
  page = await mountPage()
  await waitForState(() => expect(button('B')).toBeTruthy())
  await type('unsent A draft')
  const composer = page.container.querySelector('textarea')

  await deleteOtherSession()

  expect(page.location).toBe('?sessionId=A')
  expect(page.container.querySelector('textarea')).toBe(composer)
  expect(page.container.querySelector('textarea')?.value).toBe('unsent A draft')
  expect(page.container.textContent).toContain('A history')
})

it('deleting another conversation keeps the selected conversation stream alive', async () => {
  page = await mountPage()
  await waitForState(() => expect(button('B')).toBeTruthy())
  const body = stream()
  api.runAgentSession.mockResolvedValueOnce(body.response)
  await type('A question')
  await act(async () => button('Send').click())
  const signal = api.runAgentSession.mock.calls[0]?.[1].signal as AbortSignal

  await deleteOtherSession()

  expect(page.location).toBe('?sessionId=A')
  expect(signal.aborted).toBe(false)
  expect(page.container.textContent).toContain('A question')
  await act(async () => {
    body.emit({
      event: 'message',
      session_id: 'A',
      data: { content: 'A answer after deleting B' },
    })
    body.end()
  })
  await waitForState(() =>
    expect(page.container.textContent).toContain('A answer after deleting B'),
  )
  expect(page.container.querySelector('textarea')?.disabled).toBe(false)
  expect(api.runAgentSession).toHaveBeenCalledTimes(1)
})

it('hiding and reopening conversation history preserves the selected conversation draft', async () => {
  page = await mountPage()
  await waitForState(() => expect(button('B')).toBeTruthy())
  await type('A draft while changing the layout')
  const composer = page.container.querySelector('textarea')

  await act(async () => button('Hide conversations').click())

  expect(page.container.querySelector('#explore-history')).toBeNull()
  expect(page.container.querySelector('textarea')).toBe(composer)
  expect(page.container.querySelector('textarea')?.value).toBe(
    'A draft while changing the layout',
  )
  expect(page.location).toBe('?sessionId=A')

  await act(async () => button('Show conversations').click())

  expect(page.container.querySelector('#explore-history')).not.toBeNull()
  expect(page.container.querySelector('textarea')).toBe(composer)
  expect(page.container.querySelector('textarea')?.value).toBe(
    'A draft while changing the layout',
  )
  expect(page.container.textContent).toContain('A history')
  expect(page.location).toBe('?sessionId=A')
})

it('keeps filters collapsed by default and preserves search, date, sort, and reset parameters', async () => {
  api.fetchSessions.mockResolvedValue({
    sessions: [session('A'), session('B')],
    total: 24,
  })
  page = await mountPage()
  await waitForState(() => expect(button('B')).toBeTruthy())
  expect(button('Filter and sort').getAttribute('aria-expanded')).toBe('false')
  expect(document.body.querySelector('input[type="date"]')).toBeNull()
  expect(
    button('Search conversation content').getAttribute('aria-expanded'),
  ).toBe('false')
  expect(
    page.container.querySelector(
      'input[aria-label="Search conversation content"]',
    ),
  ).toBeNull()
  const latestParams = () => api.fetchSessions.mock.calls.at(-1)?.[1]

  await act(async () => button('Next page').click())
  await waitForState(() => expect(latestParams()?.page).toBe(2))
  await act(async () => button('Search conversation content').click())
  await changeInput(
    page.container.querySelector(
      'input[aria-label="Search conversation content"]',
    ),
    'retrieval example',
  )
  await waitForState(() =>
    expect(latestParams()).toMatchObject({
      keywords: 'retrieval example',
      page: 1,
    }),
  )
  expect(document.body.querySelector('input[type="date"]')).toBeNull()

  await act(async () => button('Filter and sort').click())
  expect(button('Filter and sort').getAttribute('aria-expanded')).toBe('true')
  await changeInput(labeledInput('From date'), '2026-10-01')
  await changeInput(labeledInput('To date'), '2026-10-03')
  await selectOption('Sort by', 'Created')
  await selectOption('Sort direction', 'Ascending')
  await waitForState(() =>
    expect(latestParams()).toMatchObject({
      keywords: 'retrieval example',
      from_date: '2026-10-01',
      to_date: '2026-10-03',
      orderby: 'create_time',
      desc: false,
      page: 1,
    }),
  )

  await act(async () => button('Clear filters', document.body).click())
  expect(
    page.container.querySelector<HTMLInputElement>(
      'input[aria-label="Search conversation content"]',
    )?.value,
  ).toBe('')
  expect(labeledInput('From date')?.value).toBe('')
  expect(labeledInput('To date')?.value).toBe('')
  expect(button('Sort by', document.body).textContent).toBe('Updated')
  expect(button('Sort direction', document.body).textContent).toBe('Descending')
  await escapePopup()
  expect(button('Filter and sort').getAttribute('aria-expanded')).toBe('false')
  expect(document.body.querySelector('input[type="date"]')).toBeNull()
  // Clearing can reuse the cached default query. The next uncached search
  // verifies that all reset values reach the API rather than only the form.
  await changeInput(
    page.container.querySelector(
      'input[aria-label="Search conversation content"]',
    ),
    'another retrieval example',
  )
  await waitForState(() =>
    expect(latestParams()).toMatchObject({
      keywords: 'another retrieval example',
      from_date: '',
      to_date: '',
      orderby: 'update_time',
      desc: true,
      page: 1,
    }),
  )
  expect(page.location).toBe('?sessionId=A')
})

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
  await act(async () => button('Send').click())
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
  await act(async () => button('Send').click())
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
  await act(async () => button('New chat').click())
  await type('first new message')
  await act(async () => button('Send').click())
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
  await act(async () => button('Send').click())
  expect(api.createSession).toHaveBeenCalledTimes(1)
  expect(api.runAgentSession.mock.calls[1]?.[0].session_id).toBe('created')
  await act(async () => second.end())
})

it.each(['B', 'New chat'])(
  'late creation cannot promote the page after selecting %s',
  async (target) => {
    page = await mountPage()
    await waitForState(() => expect(button('B')).toBeTruthy())
    const obsolete = deferred<AgentSession>()
    api.createSession.mockReturnValueOnce(obsolete.promise)
    await act(async () => button('New chat').click())
    await type('old new question')
    await act(async () => button('Send').click())
    expect(api.createSession).toHaveBeenCalledTimes(1)
    await act(async () => button(target).click())
    await act(async () => obsolete.resolve(session('obsolete')))
    expect(api.runAgentSession).not.toHaveBeenCalled()
    expect(page.location).toBe(target === 'B' ? '?sessionId=B' : '?isNew=true')
    expect(page.container.textContent).not.toContain('old new question')
    if (target === 'New chat') {
      api.createSession.mockResolvedValueOnce(session('fresh'))
      const next = stream()
      api.runAgentSession.mockResolvedValueOnce(next.response)
      await type('fresh new question')
      await act(async () => button('Send').click())
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
  await act(async () => button('New chat').click())
  await type('fast new question')
  await act(async () => button('Send').click())
  await waitForState(() =>
    expect(page.location).toBe('?sessionId=fast-created'),
  )
  await waitForState(() =>
    expect(page.container.textContent).toContain('fast answer'),
  )
  expect(page.container.textContent).toContain('fast new question')
  expect(page.container.querySelector('textarea')?.disabled).toBe(false)
})

it('stopping output shows the owned feedback in details without claiming an execution error', async () => {
  page = await mountPage()
  await waitForState(() => expect(button('B')).toBeTruthy())
  const body = stream()
  api.runAgentSession.mockResolvedValueOnce(body.response)
  await type('question')
  await act(async () => button('Send').click())
  await act(async () => button('Stop').click())
  expect(page.container.textContent).toContain('Output disconnected')
  await act(async () => button('Run details').click())
  expect(document.body.textContent).toContain('No recorded errors')
  expect(document.body.textContent).toContain('Stop request')
  expect(document.body.textContent).not.toContain(
    'An execution error was recorded',
  )
  body.end()
})

it('a delayed delete resolves against the current selection instead of the selection at click time', async () => {
  page = await mountPage()
  await waitForState(() => expect(button('B')).toBeTruthy())
  const deletion = deferred<boolean>()
  api.deleteSession.mockReturnValueOnce(deletion.promise)
  await confirmDelete('B')
  await act(async () => button('B').click())
  expect(page.location).toBe('?sessionId=B')
  api.fetchSessions.mockResolvedValue({ sessions: [session('A')], total: 1 })
  await act(async () => deletion.resolve(true))
  await waitForState(() => expect(page.location).toBe('?sessionId=A'))
  expect(page.container.textContent).toContain('A history')
})

it('first entry starts with a local composer and creates exactly one session on first send', async () => {
  page = await mountPage([], '/agent/canvas/explore')
  await waitForState(() =>
    expect(page.container.querySelector('textarea')).not.toBeNull(),
  )
  expect(page.location).toBe('')
  expect(api.createSession).not.toHaveBeenCalled()
  expect(api.runAgentSession).not.toHaveBeenCalled()
  api.createSession.mockResolvedValueOnce(session('first-created'))
  const body = stream()
  api.runAgentSession.mockResolvedValueOnce(body.response)
  await type('first entry request')
  expect(api.createSession).not.toHaveBeenCalled()
  await act(async () => button('Send').click())
  await waitForState(() =>
    expect(page.location).toBe('?sessionId=first-created'),
  )
  expect(api.createSession).toHaveBeenCalledTimes(1)
  expect(api.runAgentSession).toHaveBeenCalledTimes(1)
  expect(api.runAgentSession.mock.calls[0]?.[0]).toMatchObject({
    session_id: 'first-created',
    query: 'first entry request',
  })
  expect(
    (api.runAgentSession.mock.calls[0]?.[1].signal as AbortSignal).aborted,
  ).toBe(false)
  await act(async () => {
    body.emit({
      event: 'message',
      session_id: 'first-created',
      data: { content: 'first entry answer' },
    })
    body.end()
  })
  await waitForState(() =>
    expect(page.container.textContent).toContain('first entry answer'),
  )
  expect(api.createSession).toHaveBeenCalledTimes(1)
  expect(api.runAgentSession).toHaveBeenCalledTimes(1)
})

it('history derives default session names from user content without exposing unsupported rename', async () => {
  api.fetchSessions.mockResolvedValue({
    sessions: [
      {
        ...session('B', '  **Research**\n  next quarter  '),
        name: 'New session',
      },
    ],
    total: 1,
  })
  page = await mountPage()
  await waitForState(() => expect(button('Research next quarter')).toBeTruthy())
  await act(async () => button('Options for “Research next quarter”').click())
  expect(document.body.textContent).toContain('Copy conversation link')
  expect(document.body.textContent).toContain('Delete conversation')
  expect(document.body.querySelector('[aria-label*="Rename"]')).toBeNull()
  expect(
    Array.from(document.body.querySelectorAll('button')).some(
      (item) => item.textContent?.trim() === 'Rename',
    ),
  ).toBe(false)
  expect(api.createSession).not.toHaveBeenCalled()
  expect(api.deleteSession).not.toHaveBeenCalled()
})

it('cancelling the conversation deletion dialog leaves the selected draft and server state intact', async () => {
  page = await mountPage()
  await waitForState(() => expect(button('B')).toBeTruthy())
  await type('keep this A draft')
  const dialog = await openDeleteConfirmation('B')
  expect(api.deleteSession).not.toHaveBeenCalled()
  await act(async () => button('Cancel', dialog).click())
  expect(document.body.querySelector('[role="alertdialog"]')).toBeNull()
  expect(api.deleteSession).not.toHaveBeenCalled()
  expect(page.location).toBe('?sessionId=A')
  expect(page.container.querySelector('textarea')?.value).toBe(
    'keep this A draft',
  )
})
