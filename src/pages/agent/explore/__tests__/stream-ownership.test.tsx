import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AgentRuntimeStatus } from '../../features/runtime-workbench/types'
import { setProductLanguage } from '@/locales/i18n'
import zhCNAgent from '@/locales/zh-CN/agent'
import { buildRuntimeThoughtChainNodes } from '../../features/runtime-workbench/thought-chain-utils'
import {
  api,
  deferred,
  mountChat,
  notifications,
  resetAPI,
  session,
  stream,
  type ChatHarness,
} from './explore-chat-test-harness'

let harness: ChatHarness
beforeEach(resetAPI)
afterEach(async () => {
  await harness?.dispose()
})

it.each([100, undefined])(
  'strict failure code %s without message ID marks the trace as failed',
  async (code) => {
    await setProductLanguage('en-US')
    harness = await mountChat({ id: 'B' })
    const body = stream()
    api.runAgentSession.mockResolvedValueOnce(body.response)
    const request = await harness.start()
    await act(async () => {
      body.emit({
        event: 'node_started',
        message_id: 'real-message',
        session_id: 'B',
        data: { component_id: 'begin', component_name: 'Begin' },
      })
      body.emit({
        event: 'node_finished',
        message_id: 'real-message',
        session_id: 'B',
        data: { component_id: 'begin' },
      })
      body.emit({
        event: 'error',
        code,
        message: 'private strict error',
        session_id: 'B',
        data: { error: 'private strict error' },
      })
      body.done()
      await request.pending
    })
    expect(harness.chat.status).toBe(AgentRuntimeStatus.ERROR)
    const message = harness.chat.messages.at(-1)
    expect(message?.error).toBe('The run failed. Try again later.')
    expect(
      buildRuntimeThoughtChainNodes(message?.logEvents).some(
        (node) => node.status === 'error',
      ),
    ).toBe(true)
    expect(JSON.stringify(message)).not.toContain('private')
  },
)

describe('Explore request owns setup, frames and completion', () => {
  it.each(['message_end', 'workflow_finished', 'user_inputs'])(
    'accepts current-ID and ID-free events with a valid %s terminal after foreign frames',
    async (terminal) => {
      harness = await mountChat({ id: 'B' })
      const body = stream()
      api.runAgentSession.mockResolvedValueOnce(body.response)
      const request = await harness.start()
      await act(async () => {
        body.emit({
          event: 'message',
          session_id: 'A',
          data: { content: 'foreign' },
        })
        body.emit({
          event: 'message',
          session_id: 'B',
          data: { content: 'current ' },
        })
        body.emit({ event: 'message', data: { content: 'ID-free' } })
        body.emit({
          event: terminal,
          data:
            terminal === 'user_inputs'
              ? { inputs: { reply: { type: 'string' } } }
              : {},
        })
        body.done()
        await request.pending
      })
      expect(harness.chat.status).toBe(AgentRuntimeStatus.SUCCESS)
      expect(harness.chat.messages.at(-1)?.content).toBe('current ID-free')
      expect(notifications.error).not.toHaveBeenCalled()
      if (terminal === 'user_inputs')
        expect(harness.chat.messages.at(-1)?.awaitingInputs).toBeTruthy()
    },
  )

  it('a stopped foreign-only stream cannot fail or unlock a newer B request', async () => {
    harness = await mountChat({ id: 'B' })
    const old = stream()
    api.runAgentSession.mockResolvedValueOnce(old.response)
    const first = await harness.start('old B')
    await act(async () =>
      old.emit({
        event: 'message',
        session_id: 'A',
        data: { content: 'foreign' },
      }),
    )
    await act(async () => harness.chat.handleStop())
    const current = stream()
    api.runAgentSession.mockResolvedValueOnce(current.response)
    const second = await harness.start('new B')
    await act(async () => {
      old.done()
      await first.pending
    })
    expect(harness.chat.status).toBe(AgentRuntimeStatus.RUNNING)
    expect(notifications.error).not.toHaveBeenCalled()
    await act(async () => {
      current.emit({ event: 'message', data: { content: 'new answer' } })
      current.end()
      await second.pending
    })
    expect(harness.chat.status).toBe(AgentRuntimeStatus.SUCCESS)
    expect(harness.chat.messages.at(-1)?.content).toBe('new answer')
  })

  it('foreign-only failure also uses the fixed Chinese feedback and ignores ID-free DONE envelopes', async () => {
    await setProductLanguage('zh-CN')
    harness = await mountChat({ id: 'B' })
    const body = stream()
    api.runAgentSession.mockResolvedValueOnce(body.response)
    const request = await harness.start()
    await act(async () => {
      body.emit({ event: 'message_end', session_id: 'A', data: {} })
      body.emit({ retcode: 0, data: true })
      body.done()
      await request.pending
    })
    expect(harness.chat.status).toBe(AgentRuntimeStatus.ERROR)
    expect(harness.chat.lastError).toBe(zhCNAgent.agent.runtime.runFailed)
    expect(notifications.error).toHaveBeenCalledExactlyOnceWith(
      zhCNAgent.agent.runtime.runFailed,
    )
  })

  it.each([
    ['message', 'EOF'],
    ['message', 'DONE'],
    ['error', 'EOF'],
    ['error', 'DONE'],
    ['message_end', 'EOF'],
    ['message_end', 'DONE'],
  ])(
    'fails a B stream containing only foreign %s frames followed by %s',
    async (event, ending) => {
      await setProductLanguage('en-US')
      harness = await mountChat({ id: 'B' })
      const body = stream()
      api.runAgentSession.mockResolvedValueOnce(body.response)
      const invalidate = vi.spyOn(harness.queryClient, 'invalidateQueries')
      const request = await harness.start('B question')
      await act(async () => {
        body.emit({
          event,
          session_id: 'A',
          message_id: 'foreign',
          task_id: 'foreign',
          ...(event === 'error'
            ? { retcode: 500, retmsg: 'private A failure' }
            : {}),
          data: { content: 'foreign answer' },
        })
        if (ending === 'DONE') body.done()
        else body.end()
        await request.pending
      })
      expect(harness.chat.status).toBe(AgentRuntimeStatus.ERROR)
      expect(harness.chat.currentMessageId).toBeUndefined()
      expect(harness.chat.latestTaskId).toBeUndefined()
      expect(harness.chat.messages.at(-1)).toMatchObject({
        content: 'The run failed. Try again later.',
        error: 'The run failed. Try again later.',
        isStreaming: false,
      })
      expect(notifications.error).toHaveBeenCalledExactlyOnceWith(
        'The run failed. Try again later.',
      )
      expect(invalidate).not.toHaveBeenCalled()
      expect(harness.onSessionReady).not.toHaveBeenCalled()
    },
  )

  it('drops all late A frames and terminal writes while B is running', async () => {
    harness = await mountChat()
    const a = stream()
    api.runAgentSession.mockResolvedValueOnce(a.response)
    const first = await harness.start('A question')
    await act(async () =>
      a.emit({
        event: 'workflow_started',
        session_id: 'A',
        message_id: 'A-msg',
        task_id: 'A-task',
        data: {},
      }),
    )
    const aSignal = api.runAgentSession.mock.calls[0]?.[1].signal as AbortSignal
    await harness.select('B')
    expect(aSignal.aborted).toBe(true)
    expect(harness.chat.currentMessageId).toBeUndefined()
    expect(harness.chat.latestTaskId).toBeUndefined()
    const b = stream()
    api.runAgentSession.mockResolvedValueOnce(b.response)
    const second = await harness.start('B question')
    const bSignal = api.runAgentSession.mock.calls[1]?.[1].signal as AbortSignal
    const invalidate = vi.spyOn(harness.queryClient, 'invalidateQueries')
    await act(async () => {
      a.emit({ event: 'message', data: { content: 'late A without ID' } })
      a.emit({
        event: 'message',
        session_id: 'B',
        message_id: 'spoof',
        task_id: 'spoof',
        data: { content: 'spoofed B' },
      })
      a.emit({
        event: 'message_end',
        session_id: 'A',
        message_id: 'A-end',
        data: { reference: 'old reference' },
      })
      a.emit({ retcode: 500, retmsg: 'secret A error', data: {} })
      a.emit({
        event: 'workflow_finished',
        session_id: 'A',
        data: { outputs: { _ERROR: 'old failure' } },
      })
      a.end()
      await first.pending
    })
    expect(harness.chat.messages.map((row) => row.content)).toEqual([
      'B history',
      'B question',
      '',
    ])
    expect(harness.chat.status).toBe(AgentRuntimeStatus.RUNNING)
    expect(harness.chat.lastError).toBeUndefined()
    expect(harness.chat.currentMessageId).toBeUndefined()
    expect(harness.chat.latestTaskId).toBeUndefined()
    expect(harness.onSessionReady).not.toHaveBeenCalled()
    expect(notifications.error).not.toHaveBeenCalled()
    expect(invalidate).not.toHaveBeenCalled()
    expect(bSignal.aborted).toBe(false)
    await act(async () =>
      b.emit({
        event: 'message',
        session_id: 'B',
        message_id: 'B-msg',
        task_id: 'B-task',
        data: { content: 'B answer' },
      }),
    )
    expect(harness.chat.currentMessageId).toBe('B-msg')
    expect(harness.chat.latestTaskId).toBe('B-task')
    await act(async () => harness.chat.handleStop())
    expect(bSignal.aborted).toBe(true)
    expect(api.cancelTask).toHaveBeenCalledExactlyOnceWith('B-task')
    expect(harness.chat.status).toBe(AgentRuntimeStatus.STOPPED)
    b.end()
    await act(async () => second.pending)
    expect(harness.chat.status).toBe(AgentRuntimeStatus.STOPPED)
  })

  it.each(['resolve', 'reject'] as const)(
    'ignores late HTTP %s before A receives any frame',
    async (outcome) => {
      harness = await mountChat()
      const http = deferred<Response>()
      api.runAgentSession.mockReturnValueOnce(http.promise)
      const first = await harness.start('A setup')
      await harness.select('B')
      const b = stream()
      api.runAgentSession.mockResolvedValueOnce(b.response)
      const second = await harness.start('B setup')
      await act(async () => {
        if (outcome === 'resolve') http.resolve(stream().response)
        else http.reject(new Error('secret'))
        await first.pending
      })
      expect(harness.chat.messages.map((row) => row.content)).toEqual([
        'B history',
        'B setup',
        '',
      ])
      expect(harness.chat.status).toBe(AgentRuntimeStatus.RUNNING)
      expect(notifications.error).not.toHaveBeenCalled()
      const signal = api.runAgentSession.mock.calls[1]?.[1]
        .signal as AbortSignal
      await act(async () => harness.chat.handleStop())
      expect(signal.aborted).toBe(true)
      b.end()
      await act(async () => second.pending)
    },
  )

  it('A -> B -> A rejects the old A generation even when frame IDs now match', async () => {
    harness = await mountChat()
    const old = stream()
    api.runAgentSession.mockResolvedValueOnce(old.response)
    const first = await harness.start('old question')
    await harness.select('B')
    await harness.select('A')
    const next = stream()
    api.runAgentSession.mockResolvedValueOnce(next.response)
    const second = await harness.start('new question')
    await act(async () => {
      old.emit({
        event: 'message',
        session_id: 'A',
        message_id: 'old-message',
        data: { content: 'old answer' },
      })
      old.end()
      await first.pending
    })
    expect(harness.chat.messages.map((row) => row.content)).toEqual([
      'A history',
      'new question',
      '',
    ])
    await act(async () =>
      next.emit({
        event: 'message',
        session_id: 'A',
        message_id: 'new-message',
        data: { content: 'new answer' },
      }),
    )
    expect(harness.chat.messages.at(-1)?.content).toBe('new answer')
    expect(harness.chat.currentMessageId).toBe('new-message')
    next.end()
    await act(async () => second.pending)
    expect(harness.chat.status).toBe(AgentRuntimeStatus.SUCCESS)
  })

  it('drops mismatched IDs in the current stream, accepts absent IDs by request ownership', async () => {
    harness = await mountChat({ id: 'B' })
    const body = stream()
    api.runAgentSession.mockResolvedValueOnce(body.response)
    const request = await harness.start()
    await act(async () =>
      body.emit({
        event: 'message',
        session_id: 'A',
        message_id: 'wrong',
        task_id: 'wrong',
        data: { content: 'wrong' },
      }),
    )
    expect(harness.chat.currentMessageId).toBeUndefined()
    expect(harness.chat.latestTaskId).toBeUndefined()
    await act(async () =>
      body.emit({
        event: 'message',
        message_id: 'right',
        data: { content: 'accepted' },
      }),
    )
    expect(harness.chat.messages.at(-1)?.content).toBe('accepted')
    expect(harness.chat.currentMessageId).toBe('right')
    body.end()
    await act(async () => request.pending)
  })

  it.each(['envelope', 'workflow'] as const)(
    'renders safe translated %s errors and retains ERROR on stream completion',
    async (kind) => {
      harness = await mountChat()
      const body = stream()
      api.runAgentSession.mockResolvedValueOnce(body.response)
      const request = await harness.start()
      await act(async () =>
        body.emit(
          kind === 'envelope'
            ? { retcode: 500, retmsg: 'private password', data: {} }
            : {
                event: 'workflow_finished',
                data: { outputs: { _ERROR: 'private password' } },
              },
        ),
      )
      body.end()
      await act(async () => request.pending)
      expect(harness.chat.status).toBe(AgentRuntimeStatus.ERROR)
      expect(harness.chat.lastError).toBeTruthy()
      expect(JSON.stringify(harness.chat.messages)).not.toContain(
        'private password',
      )
      expect(harness.chat.lastError).not.toContain('private password')
    },
  )

  it('stopping pending creation permits retry and ignores the first creation result', async () => {
    harness = await mountChat({ id: '', isNew: true })
    const old = deferred<ReturnType<typeof session>>()
    api.createSession
      .mockReturnValueOnce(old.promise)
      .mockResolvedValueOnce(session('new'))
    const first = await harness.start()
    await act(async () => harness.chat.handleStop())
    expect(harness.chat.status).toBe(AgentRuntimeStatus.STOPPED)
    const body = stream()
    api.runAgentSession.mockResolvedValueOnce(body.response)
    const second = await harness.start()
    await act(async () => {
      old.resolve(session('obsolete'))
      await first.pending
    })
    expect(harness.onSessionReady).toHaveBeenCalledExactlyOnceWith('new')
    expect(api.runAgentSession).toHaveBeenCalledTimes(1)
    expect(harness.chat.status).toBe(AgentRuntimeStatus.RUNNING)
    body.end()
    await act(async () => second.pending)
  })

  it('unmount invalidates a pending setup and prevents late feedback/navigation', async () => {
    harness = await mountChat()
    const http = deferred<Response>()
    api.runAgentSession.mockReturnValueOnce(http.promise)
    const first = await harness.start()
    await harness.dispose()
    const old = harness
    await act(async () => {
      http.reject(new Error('secret'))
      await first.pending
    })
    expect(old.onSessionReady).not.toHaveBeenCalled()
    expect(notifications.error).not.toHaveBeenCalled()
    expect(
      (api.runAgentSession.mock.calls[0]?.[1].signal as AbortSignal).aborted,
    ).toBe(true)
  })
})
