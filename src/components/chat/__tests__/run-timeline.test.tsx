import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { RunTimeline } from '../run-timeline'
import { CodeBlock } from '../CodeBlock'
import { ScopedTheme, setAppearance } from '@/themes'
import type { AgentTimelineNode } from '@/lib/streaming'
import { stubChatDOM } from './chat-dom'
import { setProductLanguage } from '@/locales/i18n'
import { createInstance } from 'i18next'
import { I18nextProvider } from 'react-i18next'
import en from '@/locales/en-US/chat'
import zh from '@/locales/zh-CN/chat'

// Reasoning steps render Markdown; the diagram vendor has an unresolved ESM import in Node.
vi.mock('@ant-design/x', () => ({ Mermaid: () => null }))
vi.mock('react-shiki/core', () => ({
  useShikiHighlighter: () => undefined,
  createJavaScriptRegexEngine: () => ({}),
}))
let root: Root
let host: HTMLDivElement
const node: AgentTimelineNode = {
  id: 'call-1',
  kind: 'tool',
  title: 'lookup',
  status: 'loading',
  metadata: { toolName: 'lookup' },
  content: { arguments: { q: 'fixture' } },
}
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

it('only shows actual steps, keeps user disclosure choice, and makes unfinished outcomes unconfirmed', async () => {
  await act(async () =>
    root.render(<RunTimeline nodes={[node]} phase="running" />),
  )
  // Each step is one line: its arguments and result stay behind the disclosure.
  const disclosure = host.querySelector('details')!
  expect(disclosure.open).toBe(false)
  expect(disclosure.querySelector('summary code')?.textContent).toBe('lookup')
  disclosure.open = true
  expect(host.textContent).toContain('1 steps')
  expect(host.querySelector('[data-step-status="loading"]')).not.toBeNull()
  expect(host.querySelector('.chat-shimmer')?.textContent).toBe('Running')
  await act(async () =>
    root.render(<RunTimeline nodes={[node]} phase="locallyStopped" />),
  )
  expect(host.querySelector('details')).toBe(disclosure)
  expect(disclosure.open).toBe(true)
  expect(host.querySelector('[data-step-status="unconfirmed"]')).not.toBeNull()
  expect(host.querySelector('.animate-spin')).toBeNull()
  expect(host.textContent).not.toContain('Completed')
  expect(host.textContent).not.toContain('%')
})

it.each([0, false])(
  'preserves a confirmed %s result while other steps remain unconfirmed',
  async (result) => {
    await act(async () =>
      root.render(
        <RunTimeline
          phase="completed"
          nodes={[
            { ...node, status: 'success', content: { result } },
            { ...node, id: 'missing-result' },
          ]}
        />,
      ),
    )
    expect(host.querySelector('[data-step-status="success"]')).not.toBeNull()
    expect(
      host.querySelector('[data-step-status="unconfirmed"]'),
    ).not.toBeNull()
    expect(host.textContent).toContain(String(result))
  },
)

it('summarizes a list result as a count and shows the observed duration', async () => {
  await act(async () =>
    root.render(
      <RunTimeline
        phase="completed"
        nodes={[
          {
            ...node,
            status: 'success',
            metadata: { toolName: 'lookup', elapsedMs: 420 },
            content: { arguments: { q: 'x' }, result: [1, 2, 3] },
          },
        ]}
      />,
    ),
  )
  const summary = host.querySelector('summary')!
  expect(summary.textContent).toContain('Returned 3 items')
  expect(summary.querySelector('.run-step-duration')?.textContent).toBe('0.4s')
  // No approval controls: the web backend cannot pause a tool for confirmation.
  expect(host.querySelectorAll('button')).toHaveLength(0)
})

it('code follows the nearest appearance scope and updates without replacing the block', async () => {
  setAppearance({ mode: 'dark', preset: 'studio' })
  await act(async () =>
    root.render(
      <ScopedTheme theme="light" preset="paper" textScale={1.25}>
        <CodeBlock code="const x = 0" language="ts" />
      </ScopedTheme>,
    ),
  )
  const block = host.querySelector<HTMLElement>('.code-block')!
  expect(block.dataset.codeMode).toBe('light')
  expect(block.dataset.codePreset).toBe('paper')
  await act(async () =>
    root.render(
      <ScopedTheme theme="dark" preset="ocean" textScale={1.125}>
        <CodeBlock code="const x = 0" language="ts" />
      </ScopedTheme>,
    ),
  )
  expect(host.querySelector('.code-block')).toBe(block)
  expect(block.dataset.codeMode).toBe('dark')
  expect(block.dataset.codePreset).toBe('ocean')
  expect(block.textContent).toContain('const x = 0')
})

it.each([
  ['en-US', en, 'Run activity', 'Unconfirmed'],
  ['zh-CN', zh, '运行动态', '未确认'],
] as const)(
  'shared run activity renders without loading the Home catalog in %s',
  async (language, catalog, title, status) => {
    const isolated = createInstance()
    await isolated.init({
      lng: language,
      resources: { [language]: { translation: catalog } },
    })
    await act(async () =>
      root.render(
        <I18nextProvider i18n={isolated}>
          <RunTimeline nodes={[{ ...node, content: null }]} phase="failed" />
        </I18nextProvider>,
      ),
    )
    expect(host.textContent).toContain(title)
    expect(host.textContent).toContain(status)
    expect(host.textContent).not.toContain('home.agentTimeline')
    expect(
      isolated.getResource(language, 'translation', 'home'),
    ).toBeUndefined()
  },
)
