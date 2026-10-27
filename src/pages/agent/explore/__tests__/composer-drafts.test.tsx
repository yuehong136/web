import { act } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { stubNativeDialog } from '@/components/ui/__tests__/native-dialog'
import { setProductLanguage } from '@/locales/i18n'
import {
  api,
  mountPage,
  resetAPI,
  session,
  stream,
  waitForState,
} from './explore-chat-test-harness'

// W5：Explore 草稿归页面所有，按会话隔离；只在请求被接纳时清掉提交的那一份
let page: Awaited<ReturnType<typeof mountPage>>
let nativeDialog: ReturnType<typeof stubNativeDialog>
beforeEach(async () => {
  resetAPI()
  nativeDialog = stubNativeDialog()
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
  nativeDialog.restore()
  vi.unstubAllGlobals()
})

function button(name: string, scope: ParentNode = document) {
  const element = Array.from(
    scope.querySelectorAll<HTMLElement>('button,[role=button]'),
  ).find(
    (item) =>
      item.textContent?.trim() === name ||
      item.querySelector('p')?.textContent === name ||
      item.getAttribute('aria-label') === name,
  )
  if (!element) throw new Error(`Missing button ${name}`)
  return element
}
const composer = () => {
  const textarea = page.container.querySelector('textarea')
  if (!textarea) throw new Error('Missing composer')
  return textarea
}
async function type(value: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      'value',
    )?.set?.call(composer(), value)
    composer().dispatchEvent(new Event('input', { bubbles: true }))
  })
}
const press = (init: KeyboardEventInit) =>
  act(async () =>
    composer().dispatchEvent(
      new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        ...init,
      }),
    ),
  )

it('keeps the composer editable while an answer streams and sends the next turn only afterwards', async () => {
  page = await mountPage()
  await waitForState(() => expect(button('B')).toBeTruthy())
  const first = stream()
  api.runAgentSession.mockResolvedValueOnce(first.response)
  await type('first question')
  await act(async () => button('Send').click())
  await waitForState(() => expect(api.runAgentSession).toHaveBeenCalledOnce())
  expect(composer().value).toBe('')
  expect(composer().disabled).toBe(false)

  await type('next turn')
  await press({ key: 'Enter' })
  expect(api.runAgentSession).toHaveBeenCalledOnce()
  expect(composer().value).toBe('next turn')

  await act(async () => {
    first.emit({
      event: 'message',
      session_id: 'A',
      data: { content: 'first answer' },
    })
    first.end()
  })
  await waitForState(() =>
    expect(page.container.textContent).toContain('first answer'),
  )
  expect(composer().value).toBe('next turn')

  const second = stream()
  api.runAgentSession.mockResolvedValueOnce(second.response)
  await press({ key: 'Enter' })
  await waitForState(() => expect(api.runAgentSession).toHaveBeenCalledTimes(2))
  expect(api.runAgentSession.mock.calls[1]?.[0].query).toBe('next turn')
  expect(composer().value).toBe('')
  await act(async () => second.end())
})

// 部分浏览器组字结束的 Enter 只给 keyCode 229，不置 isComposing
it.each([
  ['isComposing', { key: 'Enter', isComposing: true }],
  ['keyCode 229', { key: 'Enter', keyCode: 229 }],
])(
  'an IME %s Enter confirms the composition instead of sending',
  async (_, init) => {
    page = await mountPage()
    await waitForState(() => expect(button('B')).toBeTruthy())
    await type('拼音')
    await press(init)
    expect(api.runAgentSession).not.toHaveBeenCalled()
    expect(composer().value).toBe('拼音')
  },
)

it('keeps a separate draft for each conversation across switching', async () => {
  page = await mountPage()
  await waitForState(() => expect(button('B')).toBeTruthy())
  await type('A draft')
  await act(async () => button('B').click())
  await waitForState(() => expect(page.location).toBe('?sessionId=B'))
  await waitForState(() => expect(composer().value).toBe(''))
  await type('B draft')
  await act(async () => button('A').click())
  await waitForState(() => expect(composer().value).toBe('A draft'))
  await act(async () => button('B').click())
  await waitForState(() => expect(composer().value).toBe('B draft'))
  expect(api.runAgentSession).not.toHaveBeenCalled()
})

it('keeps the draft when Begin inputs are dismissed and clears it once they are confirmed', async () => {
  // 缓存里放的是 adaptAgentFlow 之后的画布形态，Begin 表单在 graph 节点上
  const dsl = {
    graph: {
      nodes: [
        {
          id: 'begin',
          data: {
            form: {
              mode: 'conversational',
              inputs: {
                topic: {
                  name: 'topic',
                  type: 'line',
                  optional: false,
                  value: '',
                },
              },
            },
          },
        },
      ],
      edges: [],
    },
  }
  page = await mountPage([], '/agent/canvas/explore?isNew=true', dsl)
  await waitForState(() => expect(composer()).toBeTruthy())
  await type('needs inputs')
  await act(async () => button('Send').click())
  await waitForState(() => expect(button('Confirm Begin inputs')).toBeTruthy())
  expect(composer().value).toBe('needs inputs')

  await act(async () =>
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    ),
  )
  expect(() => button('Confirm Begin inputs')).toThrow()
  expect(composer().value).toBe('needs inputs')
  expect(api.createSession).not.toHaveBeenCalled()

  api.createSession.mockResolvedValueOnce(session('created'))
  const body = stream()
  api.runAgentSession.mockResolvedValueOnce(body.response)
  await act(async () => button('Send').click())
  await waitForState(() => expect(button('Confirm Begin inputs')).toBeTruthy())
  await act(async () => button('Confirm Begin inputs').click())
  await waitForState(() => expect(page.location).toBe('?sessionId=created'))
  expect(api.runAgentSession.mock.calls[0]?.[0]).toMatchObject({
    session_id: 'created',
    query: 'needs inputs',
    inputs: { topic: { value: 'begin value' } },
  })
  await waitForState(() => expect(composer().value).toBe(''))
  await act(async () => body.end())
})
