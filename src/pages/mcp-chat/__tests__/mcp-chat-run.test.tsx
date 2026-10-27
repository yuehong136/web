import { act, useLayoutEffect, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useMcpChatRun } from '../use-mcp-chat-run'
import type { ChatSession } from '@/types/mcp'
import type { MCPChatServiceRequest } from '@/api/mcp-chat-service'
import {
  encodeSSE,
  fixtureResponse,
  structuredChatFixtures,
} from '@/lib/streaming/__tests__/fixtures/structured-chat'

let root: Root
let container: HTMLDivElement
let hook: ReturnType<typeof useMcpChatRun>
let sessions: ChatSession[]
let unmounted: boolean
const onProgress = vi.fn()
const request: MCPChatServiceRequest = {
  prompt: '',
  messages: [{ role: 'user', content: 'question' }],
  llm_name: 'fixture',
  stream: true,
  gen_conf: {},
}
function Harness({ sessionId = 's1' }: { sessionId?: string }) {
  const [value, setSessions] = useState<ChatSession[]>([
    { id: 's1', title: 'Fixture', timestamp: '', messages: [] },
    { id: 's2', title: 'Other fixture', timestamp: '', messages: [] },
  ])
  const result = useMcpChatRun({ sessionId, setSessions, onProgress })
  useLayoutEffect(() => {
    sessions = value
    hook = result
  })
  return <output aria-busy={result.isStreaming}>{JSON.stringify(value)}</output>
}
beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
    setTimeout(() => callback(0), 1),
  )
  vi.stubGlobal('cancelAnimationFrame', clearTimeout)
  onProgress.mockReset()
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  unmounted = false
  await act(async () => root.render(<Harness />))
})
afterEach(async () => {
  if (!unmounted) await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

it('persists a completed answer once through duplicate/late terminal events', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        fixtureResponse([
          ...structuredChatFixtures.completed,
          { retcode: 0, data: true },
          { retcode: 102, data: '', retmsg: 'private late error' },
        ]),
      ),
  )
  await act(async () => hook.run('s1', request))
  expect(sessions[0].messages.map((message) => message.role)).toEqual([
    'user',
    'assistant',
  ])
  const answer = sessions[0].messages[1]
  expect(answer.content).toBe('Complete answer')
  expect(answer.runPhase).toBe('completed')
  expect(answer.parsedToolCalls?.[0].result).toBe(0)
  expect(hook.isStreaming).toBe(false)
})

it.each(['eof', 'error'] as const)(
  'preserves partial content on %s without inventing completion',
  async (outcome) => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          fixtureResponse(
            outcome === 'error'
              ? structuredChatFixtures.failed
              : structuredChatFixtures.partial,
          ),
        ),
    )
    await act(async () => hook.run('s1', request))
    const answer = sessions[0].messages[1]
    expect(answer.content).toBe('Partial answer')
    expect(answer.runPhase).toBe(outcome === 'error' ? 'failed' : 'interrupted')
    expect(container.textContent).not.toContain('private-upstream-detail')
    expect(hook.isStreaming).toBe(false)
  },
)

it('stop retains the last received chunk and only labels local reception stopped', async () => {
  let cancelled = false
  let progressed!: () => void
  const ready = new Promise<void>((resolve) => {
    progressed = resolve
  })
  onProgress.mockImplementation(progressed)
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(
              new TextEncoder().encode(
                encodeSSE(structuredChatFixtures.partial),
              ),
            )
          },
          cancel() {
            cancelled = true
          },
        }),
        { headers: { 'content-type': 'text/event-stream' } },
      ),
    ),
  )
  await act(async () => {
    const pending = hook.run('s1', request)
    await ready
    hook.stop()
    hook.stop()
    await pending
  })
  expect(sessions[0].messages).toHaveLength(2)
  expect(sessions[0].messages[1]).toMatchObject({
    content: 'Partial answer',
    runPhase: 'locallyStopped',
  })
  expect(cancelled).toBe(true)
  expect(hook.isStreaming).toBe(false)
})

it('a stopped old response cannot overwrite a newer attempt or mark the old answer successful', async () => {
  let release!: (response: Response) => void
  const fetcher = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          release = resolve
        }),
    )
    .mockResolvedValueOnce(fixtureResponse(structuredChatFixtures.completed))
  vi.stubGlobal('fetch', fetcher)
  let old!: Promise<void>
  await act(async () => {
    old = hook.run('s1', request)
    hook.stop()
    await hook.run('s1', request)
    release(
      fixtureResponse([
        { retcode: 0, data: 'stale answer' },
        { retcode: 0, data: true },
      ]),
    )
    await old
  })
  expect(
    sessions[0].messages
      .filter((message) => message.role === 'assistant')
      .map((message) => message.runPhase),
  ).toEqual(['locallyStopped', 'completed'])
  expect(container.textContent).not.toContain('stale answer')
})

it('changing sessions stops the old subscription and unmount aborts outstanding transport', async () => {
  const signals: AbortSignal[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((_url, init: RequestInit) => {
      signals.push(init.signal!)
      return new Promise((_resolve, reject) =>
        init.signal!.addEventListener('abort', () =>
          reject(init.signal!.reason),
        ),
      )
    }),
  )
  let old!: Promise<void>
  await act(async () => {
    old = hook.run('s1', request)
  })
  await act(async () => {
    root.render(<Harness sessionId="s2" />)
  })
  await act(async () => {
    await old
  })
  expect(signals[0].aborted).toBe(true)
  expect(sessions[0].messages[1].runPhase).toBe('locallyStopped')
  let pending!: Promise<void>
  await act(async () => {
    pending = hook.run('s2', request)
  })
  await act(async () => {
    root.unmount()
    unmounted = true
    await pending
  })
  expect(signals[1].aborted).toBe(true)
})
