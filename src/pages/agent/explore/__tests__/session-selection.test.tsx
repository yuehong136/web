import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AgentRuntimeStatus } from '../../features/runtime-workbench/types'
import type { AgentSession } from '@/types/agent'
import {
  agentKeys,
  api,
  deferred,
  mountChat,
  notifications,
  resetAPI,
  session,
  stream,
  waitForState,
  type ChatHarness,
} from './explore-chat-test-harness'

let harness: ChatHarness
beforeEach(resetAPI)
afterEach(async () => {
  await harness?.dispose()
})

describe('Explore selected session and creation ownership', () => {
  it('sends to B immediately after A -> B, with only B history', async () => {
    harness = await mountChat()
    await harness.select('B')
    const body = stream()
    api.runAgentSession.mockResolvedValueOnce(body.response)
    const { pending } = await harness.start('B question')
    expect(api.runAgentSession).toHaveBeenCalledWith(
      expect.objectContaining({ session_id: 'B' }),
      expect.anything(),
    )
    expect(harness.chat.messages.map((row) => row.content)).toEqual([
      'B history',
      'B question',
      '',
    ])
    body.end()
    await act(async () => pending)
  })

  it('isNew wins over a stale selected ID and rapid sends create only once', async () => {
    harness = await mountChat({ id: 'A', isNew: true })
    const created = deferred<AgentSession>()
    api.createSession.mockReturnValueOnce(created.promise)
    const first = await harness.start('new question')
    await harness.start('duplicate')
    expect(api.createSession).toHaveBeenCalledTimes(1)
    expect(api.runAgentSession).not.toHaveBeenCalled()
    expect(harness.chat.loading).toBe(true)
    const body = stream()
    api.runAgentSession.mockResolvedValueOnce(body.response)
    await act(async () => {
      created.resolve(session('new-session'))
      await Promise.resolve()
    })
    expect(api.runAgentSession).toHaveBeenCalledWith(
      expect.objectContaining({ session_id: 'new-session' }),
      expect.anything(),
    )
    expect(harness.onSessionReady).toHaveBeenCalledExactlyOnceWith(
      'new-session',
    )
    body.end()
    await act(async () => first.pending)
    expect(harness.chat.status).toBe(AgentRuntimeStatus.SUCCESS)
  })

  it('reuses a newly created ID until URL promotion, retaining the in-flight answer', async () => {
    harness = await mountChat({ id: '', isNew: true })
    api.createSession.mockResolvedValueOnce(session('created'))
    const body = stream()
    api.runAgentSession.mockResolvedValueOnce(body.response)
    const first = await harness.start()
    await act(async () =>
      body.emit({
        event: 'message',
        session_id: 'created',
        data: { content: 'answer' },
      }),
    )
    await harness.select('created')
    expect(harness.chat.messages.some((row) => row.content === 'answer')).toBe(
      true,
    )
    expect(harness.chat.loading).toBe(true)
    const signal = api.runAgentSession.mock.calls[0]?.[1].signal as AbortSignal
    expect(signal.aborted).toBe(false)
    body.end()
    await act(async () => first.pending)
    const next = stream()
    api.runAgentSession.mockResolvedValueOnce(next.response)
    const second = await harness.start('continue')
    expect(api.createSession).toHaveBeenCalledTimes(1)
    expect(api.runAgentSession.mock.calls[1]?.[0].session_id).toBe('created')
    next.end()
    await act(async () => second.pending)
  })

  it('reuses a created ID across completed requests while the URL is still new', async () => {
    harness = await mountChat({ id: '', isNew: true })
    api.createSession.mockResolvedValueOnce(session('created'))
    for (let index = 0; index < 2; index++) {
      const body = stream()
      api.runAgentSession.mockResolvedValueOnce(body.response)
      const request = await harness.start(`question-${index}`)
      body.end()
      await act(async () => request.pending)
    }
    expect(api.createSession).toHaveBeenCalledTimes(1)
    expect(
      api.runAgentSession.mock.calls.map((call) => call[0].session_id),
    ).toEqual(['created', 'created'])
  })

  it.each(['resolve', 'reject'] as const)(
    'ignores obsolete create %s after selecting B',
    async (outcome) => {
      harness = await mountChat({ id: '', isNew: true })
      const created = deferred<AgentSession>()
      api.createSession.mockReturnValueOnce(created.promise)
      const first = await harness.start('old new session')
      await harness.select('B')
      await act(async () => {
        if (outcome === 'resolve') created.resolve(session('obsolete'))
        else created.reject(new Error('secret'))
        await first.pending
      })
      expect(api.runAgentSession).not.toHaveBeenCalled()
      expect(harness.onSessionReady).not.toHaveBeenCalled()
      expect(notifications.error).not.toHaveBeenCalled()
      expect(harness.chat.messages.map((row) => row.content)).toEqual([
        'B history',
      ])
      expect(harness.chat.status).toBe(AgentRuntimeStatus.IDLE)
    },
  )

  it('does not reuse a created ID for a later new selection', async () => {
    harness = await mountChat({ id: '', isNew: true })
    api.createSession
      .mockResolvedValueOnce(session('first'))
      .mockResolvedValueOnce(session('second'))
    let body = stream()
    api.runAgentSession.mockResolvedValueOnce(body.response)
    const first = await harness.start()
    body.end()
    await act(async () => first.pending)
    await harness.select('B')
    await harness.select('', true)
    body = stream()
    api.runAgentSession.mockResolvedValueOnce(body.response)
    const second = await harness.start()
    body.end()
    await act(async () => second.pending)
    expect(api.createSession).toHaveBeenCalledTimes(2)
    expect(
      api.runAgentSession.mock.calls.map((call) => call[0].session_id),
    ).toEqual(['first', 'second'])
  })

  it('blocks sends while B history loads, then merges history before sending', async () => {
    harness = await mountChat({ cached: ['A'] })
    const history = deferred<AgentSession>()
    api.fetchSession.mockReturnValueOnce(history.promise)
    await harness.select('B')
    expect(harness.chat.messages).toEqual([])
    expect(harness.chat.loadingSession).toBe(true)
    await harness.start('too early')
    expect(api.runAgentSession).not.toHaveBeenCalled()
    await act(async () => history.resolve(session('B')))
    await waitForState(() => expect(harness.chat.canSend).toBe(true))
    const body = stream()
    api.runAgentSession.mockResolvedValueOnce(body.response)
    const next = await harness.start('B question')
    expect(harness.chat.messages.map((row) => row.content)).toEqual([
      'B history',
      'B question',
      '',
    ])
    body.end()
    await act(async () => next.pending)
  })

  it('recovers from B history failure by refetch, without exposing backend text', async () => {
    api.fetchSession.mockRejectedValueOnce(new Error('secret database details'))
    harness = await mountChat({ id: 'B', cached: [] })
    await waitForState(() => expect(harness.chat.sessionError).toBe(true))
    expect(harness.chat.sessionError).toBe(true)
    expect(harness.chat.canSend).toBe(false)
    await harness.start()
    expect(api.runAgentSession).not.toHaveBeenCalled()
    api.fetchSession.mockResolvedValueOnce(session('B'))
    await act(async () => harness.chat.sessionQuery.refetch())
    await waitForState(() => expect(harness.chat.canSend).toBe(true))
    expect(harness.chat.canSend).toBe(true)
    expect(harness.chat.messages.map((row) => row.content)).toEqual([
      'B history',
    ])
  })

  it('A -> B -> A restores selected cached history instead of local A rows', async () => {
    harness = await mountChat()
    const body = stream()
    api.runAgentSession.mockResolvedValueOnce(body.response)
    const first = await harness.start('local A')
    body.end()
    await act(async () => first.pending)
    await act(async () =>
      harness.queryClient.setQueryData(
        agentKeys.session('canvas', 'A'),
        session('A', 'persisted A'),
      ),
    )
    await harness.select('B')
    await harness.select('A')
    expect(harness.chat.messages.map((row) => row.content)).toEqual([
      'persisted A',
    ])
    await waitForState(() => expect(harness.chat.canSend).toBe(true))
  })
})
