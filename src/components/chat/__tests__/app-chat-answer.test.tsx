import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AppChatAnswer } from '@/components/chat/app-chat-answer'
import { stubChatDOM } from '@/components/chat/__tests__/chat-dom'
import { setProductLanguage } from '@/locales/i18n'

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
  vi.unstubAllGlobals()
})

it('historical content with an unknown outcome stays static without claiming completion', async () => {
  await act(async () =>
    root.render(
      <AppChatAnswer
        content="<think>Recorded reasoning</think>Historical answer"
        isStreaming={false}
        onViewReference={() => {}}
      />,
    ),
  )
  expect(
    host.querySelector('.message-parts')?.getAttribute('data-run-phase'),
  ).toBeNull()
  expect(host.querySelector('.markdown-content')?.textContent).toContain(
    'Historical answer',
  )
  expect(host.querySelector('.animate-spin')).toBeNull()
  expect(host.textContent).not.toMatch(/thinking complete|completed/i)
})

it('unknown empty historical content has no loading placeholder', async () => {
  await act(async () =>
    root.render(
      <AppChatAnswer
        content=""
        isStreaming={false}
        onViewReference={() => {}}
      />,
    ),
  )
  expect(
    host.querySelector('.message-parts')?.getAttribute('data-run-phase'),
  ).toBeNull()
  expect(host.textContent).toBe('')
})

it('an explicit failed phase overrides the streaming flag while retaining the partial answer', async () => {
  await act(async () =>
    root.render(
      <AppChatAnswer
        content="Partial answer"
        isStreaming
        runPhase="failed"
        onViewReference={() => {}}
      />,
    ),
  )
  expect(host.querySelector('[data-run-phase="failed"]')).not.toBeNull()
  expect(host.querySelector('.markdown-content')?.textContent).toContain(
    'Partial answer',
  )
})
