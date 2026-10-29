import { act, useLayoutEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { agentAPI } from '@/api/agent'
import { stubChatDOM } from '@/components/chat/__tests__/chat-dom'
import { setProductLanguage } from '@/locales/i18n'
import { AgentRuntimeStatus } from '../../features/runtime-workbench/types'
import { ShareMessageList } from '../share-message-list'
import { useSharedAgentRunner } from '../use-shared-agent-runner'

// Keep the real Bubble list without loading unrelated package barrel renderers.
vi.mock('@ant-design/x', async () => {
  const module = await vi.importActual<
    typeof import('@ant-design/x/lib/bubble')
  >('@ant-design/x/lib/bubble/index.js')
  return { Bubble: module.default, Mermaid: () => null, FileCard: () => null }
})
vi.mock('react-shiki/core', () => ({
  useShikiHighlighter: () => undefined,
  createJavaScriptRegexEngine: () => ({}),
}))

const originalScrollTo = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  'scrollTo',
)
let root: Root
let host: HTMLDivElement
let runner: ReturnType<typeof useSharedAgentRunner>
const buildInputs = () => ({})

function Harness({ agentId = 'citation-agent' }: { agentId?: string }) {
  const current = useSharedAgentRunner({
    agentId,
    betaToken: 'fixture-token',
    userId: 'visitor',
    release: true,
    buildInputs,
  })
  useLayoutEffect(() => {
    runner = current
  }, [current])
  return (
    <ShareMessageList
      canvasId={agentId}
      messages={current.messages}
      status={
        current.isRunning ? AgentRuntimeStatus.RUNNING : AgentRuntimeStatus.IDLE
      }
      onSubmitAwaitingInputs={() => {}}
    />
  )
}

const stream = (name: string, index = 0) =>
  new Response(
    [
      {
        event: 'message',
        message_id: name,
        session_id: 'session',
        data: { content: `Answer [ID:${index}]` },
      },
      {
        event: 'message_end',
        message_id: name,
        session_id: 'session',
        data: {
          reference: {
            chunks: {
              [String(index)]: {
                id: `${name}-chunk`,
                document_id: `${name}-doc`,
                document_name: `${name}.pdf`,
                dataset_id: 'dataset',
                content: `Content for ${name}`,
              },
            },
          },
        },
      },
    ]
      .map((frame) => `data:${JSON.stringify(frame)}\n\n`)
      .join(''),
    {
      headers: { 'Content-Type': 'text/event-stream' },
    },
  )

beforeEach(async () => {
  stubChatDOM()
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
    configurable: true,
    value: vi.fn(),
  })
  await setProductLanguage('en-US')
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
    })),
  )
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  if (originalScrollTo)
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', originalScrollTo)
  else Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo')
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('renders each SSE message citation in the shared widget and retains the first turn after the second', async () => {
  const run = vi
    .spyOn(agentAPI, 'runExternalAgent')
    .mockResolvedValueOnce(stream('first'))
    .mockResolvedValueOnce(stream('second', 2))
  await act(async () => root.render(<Harness />))
  await act(async () => runner.submit({ query: 'first', values: {} }))
  await act(async () => runner.submit({ query: 'second', values: {} }))
  expect(run).toHaveBeenCalledTimes(2)
  const citations = [
    ...host.querySelectorAll<HTMLButtonElement>('sup > button'),
  ]
  expect(citations.map((button) => button.getAttribute('aria-label'))).toEqual([
    'Citation 0: first.pdf',
    'Citation 2: second.pdf',
  ])
  citations[1].focus()
  await act(async () => citations[1].click())
  const preview = document.querySelector(
    '[role="dialog"][aria-label="Citation 2: second.pdf"]',
  )
  expect(preview?.textContent).toContain('Content for second')
  expect(preview?.textContent).not.toContain('Content for first')
  await act(async () =>
    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    ),
  )
  await act(async () => new Promise((resolve) => setTimeout(resolve, 0)))
  expect(document.activeElement).toBe(citations[1])
  await act(async () => root.render(<Harness agentId="next-agent" />))
  expect(host.querySelector('sup > button')).toBeNull()
  expect(host.textContent).not.toContain('first.pdf')
  expect(host.textContent).not.toContain('second.pdf')
})

it('keeps a canonical numeric zero chunk visible without inventing document authorization', async () => {
  vi.spyOn(agentAPI, 'runExternalAgent').mockResolvedValue(
    new Response(
      [
        { event: 'message', data: { content: 'Legacy citation [ID:0]' } },
        {
          event: 'message_end',
          data: {
            reference: {
              chunks: [
                {
                  id: 0,
                  content: '0',
                  document_id: null,
                  document_name: null,
                  dataset_id: null,
                },
              ],
            },
          },
        },
      ]
        .map((frame) => `data:${JSON.stringify(frame)}\n\n`)
        .join(''),
      {
        headers: { 'Content-Type': 'text/event-stream' },
      },
    ),
  )
  await act(async () => root.render(<Harness />))
  await act(async () => runner.submit({ query: 'zero', values: {} }))
  const citation = host.querySelector<HTMLButtonElement>('sup > button')!
  expect(citation.getAttribute('aria-label')).toBe(
    'Citation 1: Unknown document',
  )
  await act(async () => citation.click())
  const preview = document.querySelector(
    '[role="dialog"][aria-label="Citation 1: Unknown document"]',
  )!
  expect(preview.textContent).toContain('0')
  expect(preview.querySelector('a')).toBeNull()
  expect(runner.messages.at(-1)?.reference).toMatchObject({
    chunks: [{ id: 0, content: '0' }],
  })
})

it('renders canonical gapped history-shaped citations at their original SSE marker numbers', async () => {
  const chunks = [
    {
      id: 'legacy',
      content: 'Legacy content',
      document_id: null,
      document_name: null,
      dataset_id: null,
      citation_id: '1',
    },
    {
      id: 0,
      content: 'Zero content',
      document_id: null,
      document_name: null,
      dataset_id: null,
      citation_id: '2',
    },
  ]
  vi.spyOn(agentAPI, 'runExternalAgent').mockResolvedValue(
    new Response(
      [
        {
          event: 'message',
          data: { content: 'No entry [ID:0]. Legacy [ID:1]. Zero [ID:2].' },
        },
        { event: 'message_end', data: { reference: { chunks } } },
      ]
        .map((frame) => `data:${JSON.stringify(frame)}\n\n`)
        .join(''),
      {
        headers: { 'Content-Type': 'text/event-stream' },
      },
    ),
  )
  await act(async () => root.render(<Harness />))
  await act(async () => runner.submit({ query: 'gaps', values: {} }))
  const superscripts = [...host.querySelectorAll('sup')]
  expect(superscripts[0].querySelector('button')).toBeNull()
  const citations = [
    ...host.querySelectorAll<HTMLButtonElement>('sup > button'),
  ]
  expect(citations.map((button) => button.getAttribute('aria-label'))).toEqual([
    'Citation 1: Unknown document',
    'Citation 2: Unknown document',
  ])
  await act(async () => citations[1].click())
  const preview = document.querySelector(
    '[role="dialog"][aria-label="Citation 2: Unknown document"]',
  )!
  expect(preview.textContent).toContain('Zero content')
  expect(preview.textContent).not.toContain('Legacy content')
  expect(preview.querySelector('a')).toBeNull()
})
