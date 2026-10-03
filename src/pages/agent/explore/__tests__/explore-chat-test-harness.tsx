import { act, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  MemoryRouter,
  createMemoryRouter,
  RouterProvider,
  useLocation,
} from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'
import { agentQueryKeys } from '@/hooks/use-agent-query'
import type { AgentSession } from '@/types/agent'
import { useExploreSessionChat } from '../hooks/use-explore-session-chat'
import AgentExplorePage from '../index'

const mockAPI = vi.hoisted(() => ({
  fetchAgent: vi.fn(),
  fetchVersions: vi.fn(),
  fetchVersion: vi.fn(),
  fetchSession: vi.fn(),
  createSession: vi.fn(),
  deleteSession: vi.fn(),
  runAgentSession: vi.fn(),
  cancelTask: vi.fn(),
  fetchSessions: vi.fn(),
}))
const mockNotifications = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
}))
export const agentKeys = agentQueryKeys
export const api = mockAPI
export const notifications = mockNotifications
vi.mock('@/api/agent', () => ({ agentAPI: mockAPI }))
vi.mock('@/lib/toast', () => ({ toast: mockNotifications }))
vi.mock('../../debug-content', () => ({ default: () => null }))
vi.mock('../../components/runtime-chat/runtime-chat-message-list', () => ({
  RuntimeChatMessageList: ({
    messages,
  }: {
    messages: Array<{ id: string; content: string }>
  }) => (
    <div>
      {messages.map((row) => (
        <p key={row.id}>{row.content}</p>
      ))}
    </div>
  ),
}))

Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)

export function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}

export function session(id: string, content = `${id} history`): AgentSession {
  return {
    id,
    name: id,
    messages: [{ id: `${id}-history`, role: 'user', content }],
  }
}

export function stream() {
  let controller!: ReadableStreamDefaultController<Uint8Array>
  const body = new ReadableStream<Uint8Array>({
    start(value) {
      controller = value
    },
  })
  const response = new Response(body, {
    headers: { 'Content-Type': 'text/event-stream' },
  })
  return {
    response,
    emit(frame: unknown) {
      controller.enqueue(
        new TextEncoder().encode(`data: ${JSON.stringify(frame)}\n\n`),
      )
    },
    done() {
      controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
      controller.close()
    },
    end() {
      controller.close()
    },
    fail(error: Error) {
      controller.error(error)
    },
  }
}

export async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

export async function waitForState(check: () => void) {
  await vi.waitFor(async () => {
    await flush()
    check()
  })
}

export function resetAPI() {
  Object.values(api).forEach((mock) => mock.mockReset())
  notifications.error.mockReset()
  notifications.success.mockReset()
  api.deleteSession.mockResolvedValue(true)
  api.fetchSession.mockImplementation(async (_canvas: string, id: string) =>
    session(id),
  )
  api.fetchSessions.mockResolvedValue({
    sessions: [session('A'), session('B')],
    total: 2,
  })
}

export async function mountChat(
  options: {
    id?: string
    isNew?: boolean
    cached?: string[]
    mode?: 'draft' | 'published'
  } = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
      mutations: { retry: false },
    },
  })
  const canvasId = 'canvas'
  queryClient.setQueryData(agentQueryKeys.detail(canvasId), {
    id: canvasId,
    dsl: { graph: { nodes: [], edges: [] } },
  })
  for (const id of options.cached ?? ['A', 'B'])
    queryClient.setQueryData(agentQueryKeys.session(canvasId, id), session(id))
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  const onSessionReady = vi.fn()
  let props = {
    canvasId,
    sessionId: options.id ?? 'A',
    isNew: options.isNew ?? false,
    newSessionMode: options.mode ?? 'draft',
  }
  let chat!: ReturnType<typeof useExploreSessionChat>
  function Harness() {
    chat = useExploreSessionChat({ ...props, onSessionReady })
    return null
  }
  async function render() {
    await act(async () =>
      root.render(
        <MemoryRouter>
          <QueryClientProvider client={queryClient}>
            <Harness />
          </QueryClientProvider>
        </MemoryRouter>,
      ),
    )
  }
  await render()
  let disposed = false
  return {
    get chat() {
      return chat
    },
    container,
    queryClient,
    onSessionReady,
    async select(id: string, isNew = false, nextCanvasId = canvasId) {
      props = { ...props, canvasId: nextCanvasId, sessionId: id, isNew }
      await render()
    },
    async start(content = 'question') {
      let pending!: Promise<void>
      await act(async () => {
        pending = chat.handleSendMessage({ content })
        await Promise.resolve()
      })
      return { pending }
    },
    async dispose() {
      if (disposed) return
      disposed = true
      await act(async () => root.unmount())
      queryClient.clear()
      container.remove()
    },
  }
}

export type ChatHarness = Awaited<ReturnType<typeof mountChat>>

export async function mountPage(cached = ['A', 'B']) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
      mutations: { retry: false },
    },
  })
  queryClient.setQueryData(agentQueryKeys.detail('canvas'), {
    id: 'canvas',
    title: 'Test agent',
    dsl: { graph: { nodes: [], edges: [] } },
  })
  for (const id of cached)
    queryClient.setQueryData(agentQueryKeys.session('canvas', id), session(id))
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  let location = ''
  function Page() {
    location = useLocation().search
    return <AgentExplorePage />
  }
  const router = createMemoryRouter(
    [{ path: '/agent/:id/explore', element: <Page /> }],
    { initialEntries: ['/agent/canvas/explore?sessionId=A'] },
  )
  await act(async () =>
    root.render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </StrictMode>,
    ),
  )

  return {
    container,
    get location() {
      return location
    },
    async dispose() {
      await act(async () => root.unmount())
      router.dispose()
      queryClient.clear()
      container.remove()
    },
  }
}
