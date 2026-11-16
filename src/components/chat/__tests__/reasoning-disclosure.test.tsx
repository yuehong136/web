import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import {
  REASONING_COLLAPSE_DELAY,
  ReasoningDisclosure,
} from '../reasoning-disclosure'
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

it('streams open with a shimmer, then folds into one timed line a second after it ends', async () => {
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
  // While the model thinks, its reasoning is visible (as Markdown) under the shimmer
  expect(trigger().getAttribute('aria-expanded')).toBe('true')
  expect(host.querySelector('.text-shimmer')?.textContent).toBe('Thinking…')
  expect(host.querySelector('.reasoning-markdown')).not.toBeNull()
  await act(async () => vi.advanceTimersByTime(3000))
  expect(trigger().textContent).toContain('3 s')
  await render(false)
  expect(trigger().textContent).toBe('Thought for 3 seconds')
  expect(host.querySelector('.text-shimmer')).toBeNull()
  expect(trigger().getAttribute('aria-expanded')).toBe('true')
  await act(async () => vi.advanceTimersByTime(REASONING_COLLAPSE_DELAY))
  expect(trigger().getAttribute('aria-expanded')).toBe('false')
  expect(host.querySelector('.reasoning-markdown')).toBeNull()
  vi.useRealTimers()

  await act(async () => trigger().click())
  expect(trigger().getAttribute('aria-expanded')).toBe('true')
  const body = host.querySelector('.reasoning-markdown')!
  // Reasoning is Markdown (x-markdown), not pre-wrapped text
  expect(body.querySelector('strong')?.textContent).toBe('Plan')
  expect(body.textContent).not.toContain('**')
})

it('keeps the reader’s own choice over the automatic open and fold', async () => {
  vi.useFakeTimers()
  const render = (thinking: boolean) =>
    act(async () =>
      root.render(<ReasoningDisclosure content="plan" thinking={thinking} />),
    )
  await render(true)
  await act(async () => trigger().click())
  expect(trigger().getAttribute('aria-expanded')).toBe('false')
  await render(false)
  await act(async () => trigger().click())
  await act(async () => vi.advanceTimersByTime(REASONING_COLLAPSE_DELAY * 2))
  // Opened by the reader after it finished: it does not fold away under them
  expect(trigger().getAttribute('aria-expanded')).toBe('true')
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
