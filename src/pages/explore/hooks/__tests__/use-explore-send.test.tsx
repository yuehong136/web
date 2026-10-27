import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { conversationAPI } from '@/api/conversation'
import { defaultChatSettings } from '@/components/chat/ChatSettingsPanel'
import { useAuthStore } from '@/stores/auth'
import { useExploreConversation } from '@/pages/explore/hooks/use-explore-conversation'
import { useExploreSend } from '@/pages/explore/hooks/use-explore-send'

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}
const frame = (event: unknown) => `data: ${JSON.stringify(event)}\n\n`
const response = (events: unknown[]) =>
  new Response(events.map(frame).join(''), {
    headers: { 'content-type': 'text/event-stream' },
  })

describe('Explore send lifecycle and ownership', () => {
  let root: Root
  let host: HTMLDivElement
  let client: QueryClient
  let session: ReturnType<typeof useExploreConversation>
  let send: ReturnType<typeof useExploreSend>
  let selectedApp: string
  const originalIdentity = useAuthStore.getState().token
  const clearFiles = vi.fn()
  const refetch = vi.fn()

  function Probe() {
    session = useExploreConversation()
    const [, setInputValue] = useState('')
    send = useExploreSend({
      conversation: session,
      selectedApp,
      selectedModel: 'fixture-model',
      settings: defaultChatSettings,
      enableReasoning: false,
      enableInternet: false,
      uploadedAttachments: [],
      clearUploadFiles: clearFiles,
      setInputValue,
      refetchConversations: refetch,
    })
    return (
      <>
        {session.messages
          .map(
            (message) => `${message.content}:${message.runPhase ?? 'unknown'}`,
          )
          .join('|')}
      </>
    )
  }

  beforeEach(async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    useAuthStore.setState({ token: 'identity-A' })
    clearFiles.mockClear()
    refetch.mockClear()
    selectedApp = ''
    host = document.createElement('div')
    document.body.append(host)
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    root = createRoot(host)
    vi.spyOn(conversationAPI, 'chatServiceStream').mockResolvedValue(
      response([{ data: true }]),
    )
    vi.spyOn(conversationAPI, 'completion').mockResolvedValue(
      response([{ data: true }]),
    )
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <Probe />
        </QueryClientProvider>,
      ),
    )
  })
  afterEach(async () => {
    await act(async () => root.unmount())
    client.clear()
    host.remove()
    useAuthStore.setState({ token: originalIdentity })
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it.each(['fallback', 'completion'] as const)(
    'projects EOF as interrupted for %s mode without losing the answer',
    async (mode) => {
      const fixture = response([{ data: { answer: 'Partial answer' } }])
      if (mode === 'fallback')
        vi.mocked(conversationAPI.chatServiceStream).mockResolvedValue(fixture)
      else {
        vi.mocked(conversationAPI.completion).mockResolvedValue(fixture)
        await act(async () =>
          session.setSelectedConversationDetail({ id: 'current' }),
        )
      }
      await act(async () => {
        await send('Question')
      })
      expect(session.messages.map((message) => message.content)).toEqual([
        'Question',
        'Partial answer',
      ])
      expect(session.messages[1].runPhase).toBe('interrupted')
      expect(session.isStreaming).toBe(false)
    },
  )

  it('retains a failed message and body despite a following success frame', async () => {
    vi.mocked(conversationAPI.chatServiceStream).mockResolvedValue(
      response([
        { data: 'Partial answer' },
        { retcode: 500, retmsg: 'sensitive provider details', data: '' },
        { data: true },
      ]),
    )
    await act(async () => {
      await send('Question')
    })
    expect(session.messages[1]).toMatchObject({
      content: 'Partial answer',
      runPhase: 'failed',
    })
    expect(host.textContent).not.toContain('sensitive')
  })

  it('keeps the question and a failed assistant outcome when the request itself fails', async () => {
    vi.mocked(conversationAPI.chatServiceStream).mockRejectedValue(
      new Error('private backend error'),
    )
    await act(async () => {
      await send('Question')
    })
    expect(session.messages.map((message) => message.content)).toEqual([
      'Question',
      '',
    ])
    expect(session.messages[1].runPhase).toBe('failed')
    expect(session.isStreaming).toBe(false)
  })

  it('stops a pending request locally, preserves its row and rejects its response after a new send', async () => {
    const pending = deferred<Response>()
    vi.mocked(conversationAPI.chatServiceStream).mockReturnValueOnce(
      pending.promise,
    )
    let oldSend!: Promise<void>
    await act(async () => {
      oldSend = send('Old question')
    })
    await act(async () => session.abortChat())
    expect(session.messages[1].runPhase).toBe('locallyStopped')
    await act(async () => {
      await send('New question')
    })
    expect(session.messages[3].runPhase).toBe('completed')
    await act(async () => {
      pending.resolve(response([{ data: 'stale answer' }, { data: true }]))
      await oldSend
    })
    expect(session.messages.map((message) => message.content)).toEqual([
      'Old question',
      '',
      'New question',
      '',
    ])
    expect(session.messages[1].runPhase).toBe('locallyStopped')
    expect(session.messages[3].runPhase).toBe('completed')
  })

  it('does not attach a late created conversation to the newly selected session', async () => {
    const creation = deferred<{ id: string }>()
    vi.spyOn(conversationAPI, 'setConversation').mockReturnValue(
      creation.promise,
    )
    selectedApp = 'app-A'
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <Probe />
        </QueryClientProvider>,
      ),
    )
    let oldSend!: Promise<void>
    await act(async () => {
      oldSend = send('Old question')
    })
    await act(async () => session.resetConversation('B'))
    await act(async () => {
      creation.resolve({ id: 'A' })
      await oldSend
    })
    expect(session.activeConversationKey).toBe('B')
    expect(session.messages).toEqual([])
    expect(session.selectedConversationDetail).toBeNull()
    expect(conversationAPI.completion).not.toHaveBeenCalled()
    expect(conversationAPI.chatServiceStream).not.toHaveBeenCalled()
    expect(refetch).not.toHaveBeenCalled()
  })

  it('stopping during conversation creation records a local outcome and opens no stream', async () => {
    const creation = deferred<{ id: string }>()
    vi.spyOn(conversationAPI, 'setConversation').mockReturnValue(
      creation.promise,
    )
    selectedApp = 'app-A'
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <Probe />
        </QueryClientProvider>,
      ),
    )
    let oldSend!: Promise<void>
    await act(async () => {
      oldSend = send('Question')
    })
    await act(async () => session.abortChat())
    expect(session.messages[1].runPhase).toBe('locallyStopped')
    await act(async () => {
      creation.resolve({ id: 'A' })
      await oldSend
    })
    expect(conversationAPI.completion).not.toHaveBeenCalled()
    expect(conversationAPI.chatServiceStream).not.toHaveBeenCalled()
    expect(session.selectedConversationDetail).toBeNull()
  })

  it('changing identity clears local messages and prevents late responses from entering a new account', async () => {
    const pending = deferred<Response>()
    vi.mocked(conversationAPI.chatServiceStream).mockReturnValueOnce(
      pending.promise,
    )
    let oldSend!: Promise<void>
    await act(async () => {
      oldSend = send('Private account A question')
    })
    const oldSignal = vi.mocked(conversationAPI.chatServiceStream).mock
      .calls[0][1].signal
    await act(async () => useAuthStore.setState({ token: 'identity-B' }))
    expect(oldSignal.aborted).toBe(true)
    await act(async () => {
      await send('Account B question')
    })
    await act(async () => {
      pending.resolve(
        response([{ data: 'Private account A answer' }, { data: true }]),
      )
      await oldSend
    })
    expect(session.messages.map((message) => message.content)).toEqual([
      'Account B question',
      '',
    ])
    expect(session.messages[1].runPhase).toBe('completed')
    expect(session.isStreaming).toBe(false)
  })

  it('never shares a pending history query across identity changes even with the same conversation id', async () => {
    const old = deferred<unknown>()
    const get = vi
      .spyOn(conversationAPI, 'getConversationDetail')
      .mockReturnValueOnce(old.promise)
      .mockResolvedValueOnce({
        id: 'same-id',
        message: [{ role: 'assistant', content: 'Account B history' }],
      })
    let history!: Promise<void>
    await act(async () => {
      history = session.fetchConversationDetail('same-id')
    })
    await act(async () => useAuthStore.setState({ token: 'identity-B' }))
    await act(async () => {
      await session.fetchConversationDetail('same-id')
    })
    await act(async () => {
      old.resolve({
        id: 'same-id',
        message: [{ role: 'assistant', content: 'Account A history' }],
      })
      await history
    })
    expect(get).toHaveBeenCalledTimes(2)
    expect(session.messages[0].content).toBe('Account B history')
    expect(session.messages[0].runPhase).toBeUndefined()
  })

  it('keeps the first terminal outcome and content when local stop or late writes race it', async () => {
    let run!: NonNullable<ReturnType<typeof session.beginRun>>
    await act(async () => {
      run = session.beginRun('assistant-1')!
      session.setMessages([
        {
          id: 'assistant-1',
          role: 'assistant',
          content: '',
          runPhase: 'running',
        },
      ])
      run.update({ runPhase: 'completed', content: 'Final content' })
      run.update({ runPhase: 'failed', content: 'late error' })
      session.abortChat()
    })
    expect(session.messages[0]).toMatchObject({
      runPhase: 'completed',
      content: 'Final content',
    })
    expect(run.isCurrent()).toBe(false)
    expect(session.isStreaming).toBe(false)
  })
})
