import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { conversationAPI } from '@/api/conversation'
import { useExploreConversation } from '../use-explore-conversation'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((done, fail) => {
    resolve = done
    reject = fail
  })
  return { promise, resolve, reject }
}

describe('Explore conversation ownership', () => {
  let root: Root
  let container: HTMLDivElement
  let client: QueryClient
  let session: ReturnType<typeof useExploreConversation>

  function Probe() {
    session = useExploreConversation()
    return <>{session.messages.map((message) => message.content).join('|')}</>
  }

  beforeEach(async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    container = document.createElement('div')
    document.body.append(container)
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    root = createRoot(container)
    await act(async () => {
      root.render(
        <QueryClientProvider client={client}>
          <Probe />
        </QueryClientProvider>,
      )
    })
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    client.clear()
    container.remove()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it.each(['success', 'failure'] as const)(
    'ignores a late history %s after selecting another session',
    async (outcome) => {
      const old = deferred<unknown>()
      vi.spyOn(conversationAPI, 'getConversationDetail').mockImplementation(
        (id) =>
          id === 'A'
            ? old.promise
            : Promise.resolve({
                id: 'B',
                message: [
                  { id: 'same-id', role: 'user', content: 'B', files: [] },
                ],
              }),
      )
      let pending: Promise<void>
      await act(async () => {
        pending = session.fetchConversationDetail('A')
      })
      await act(async () => {
        await session.fetchConversationDetail('B')
      })
      await act(async () => {
        if (outcome === 'success')
          old.resolve({
            id: 'A',
            message: [
              {
                id: 'same-id',
                role: 'user',
                content: 'A',
                files: [{ id: 'private-A' }],
              },
            ],
          })
        else old.reject(new Error('old failure'))
        await pending
      })
      expect(container.textContent).toBe('B')
      expect(session.activeConversationKey).toBe('B')
      expect(session.selectedConversationDetail?.id).toBe('B')
      expect(session.messages[0].files).toEqual([])
      expect(session.isLoadingConversation).toBe(false)
    },
  )

  it('invalidates pending creation/stream callbacks and aborts on switching', async () => {
    const isCurrent = session.captureSession()
    const controller = session.createController()
    await act(async () => {
      session.setIsStreaming(true)
      session.resetConversation('B')
    })
    expect(controller.signal.aborted).toBe(true)
    expect(isCurrent()).toBe(false)
    expect(session.isStreaming).toBe(false)
    expect(session.selectedConversationDetail).toBeNull()
  })

  it('invalidates stopped stream callbacks before a new send in the same session', async () => {
    const stopped = session.captureSession()
    const controller = session.createController()
    await act(async () => session.abortChat())
    const next = session.captureSession()
    expect(stopped()).toBe(false)
    expect(next()).toBe(true)
    expect(controller.signal.aborted).toBe(true)
  })

  it('restores persisted attachment descriptors and rejects a mismatched response ID', async () => {
    const file = {
      id: 'file-A',
      name: 'a.md',
      extension: 'md',
      mime_type: 'text/markdown',
      size: 0,
      created_at: 1,
    }
    const get = vi.spyOn(conversationAPI, 'getConversationDetail')
    get.mockResolvedValueOnce({
      id: 'A',
      message: [{ role: 'user', content: 'Q1', files: [file] }],
    })
    await act(async () => {
      await session.fetchConversationDetail('A')
    })
    expect(session.messages[0].files).toEqual([file])
    get.mockResolvedValueOnce({
      id: 'A',
      message: [{ role: 'user', content: 'private A', files: [file] }],
    })
    await act(async () => {
      await session.fetchConversationDetail('B')
    })
    expect(session.messages).toEqual([])
    expect(session.selectedConversationDetail).toBeNull()
  })

  it('aborts its own connection and invalidates callbacks on unmount', async () => {
    const isCurrent = session.captureSession()
    const controller = session.createController()
    await act(async () => root.unmount())
    expect(controller.signal.aborted).toBe(true)
    expect(isCurrent()).toBe(false)
  })
})
