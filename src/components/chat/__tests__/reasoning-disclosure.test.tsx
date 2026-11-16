import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ReasoningDisclosure } from '../reasoning-disclosure'
import { stubChatDOM } from './chat-dom'
import { setProductLanguage } from '@/locales/i18n'

// The diagram vendor has an unresolved extensionless ESM import in Node.
vi.mock('@ant-design/x', () => ({ Mermaid: () => null }))
vi.mock('react-shiki/core', () => ({
  useShikiHighlighter: () => undefined,
  createJavaScriptRegexEngine: () => ({}),
}))

let root: Root
let host: HTMLDivElement
beforeEach(async () => {
  stubChatDOM()
  await setProductLanguage('en-US')
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const trigger = () => host.querySelector<HTMLButtonElement>('button')!

it('is one collapsed line that shimmers while thinking and then reports the time', async () => {
  vi.useFakeTimers()
  const render = (thinking: boolean) =>
    act(async () =>
      root.render(
        <ReasoningDisclosure
          content="**Plan** the answer"
          thinking={thinking}
        />,
      ),
    )
  await render(true)
  expect(trigger().getAttribute('aria-expanded')).toBe('false')
  expect(host.querySelector('.chat-shimmer')?.textContent).toBe('Thinking…')
  // No fixed-height plain-text box: nothing renders until the reader expands it
  expect(host.querySelector('.reasoning-markdown')).toBeNull()
  await act(async () => vi.advanceTimersByTime(3000))
  expect(trigger().textContent).toContain('3 s')
  await render(false)
  expect(trigger().textContent).toBe('Thought for 3 seconds')
  expect(host.querySelector('.chat-shimmer')).toBeNull()
  vi.useRealTimers()

  await act(async () => trigger().click())
  expect(trigger().getAttribute('aria-expanded')).toBe('true')
  const body = host.querySelector('.reasoning-markdown')!
  // Reasoning is Markdown (x-markdown), not pre-wrapped text
  expect(body.querySelector('strong')?.textContent).toBe('Plan')
  expect(body.textContent).not.toContain('**')
})

it('says only “Thought” for history, where no timing was observed', async () => {
  await setProductLanguage('zh-CN')
  await act(async () =>
    root.render(<ReasoningDisclosure content="历史推理" thinking={false} />),
  )
  expect(trigger().textContent).toBe('已思考')
})

it('keeps model reasoning as untrusted text', async () => {
  await act(async () =>
    root.render(
      <ReasoningDisclosure
        content={'<img src=x onerror="bad()"><script>bad()</script>plan'}
        thinking={false}
      />,
    ),
  )
  await act(async () => trigger().click())
  expect(host.querySelector('script, img[onerror]')).toBeNull()
})
