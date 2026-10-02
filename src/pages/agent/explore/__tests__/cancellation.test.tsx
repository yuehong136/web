import { act } from 'react'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { APIError } from '@/api/client'
import { setProductLanguage } from '@/locales/i18n'
import { AgentRuntimeStatus } from '../../features/runtime-workbench/types'
import {
  api,
  deferred,
  mountChat,
  notifications,
  resetAPI,
  stream,
  type ChatHarness,
} from './explore-chat-test-harness'

let harness: ChatHarness
beforeEach(async () => {
  resetAPI()
  await setProductLanguage('en-US')
})
afterEach(async () => harness?.dispose())

it('stop uses SSE task_id, keeps local stop and reports cancellation failure safely', async () => {
  harness = await mountChat()
  const body = stream()
  api.runAgentSession.mockResolvedValue(body.response)
  const run = await harness.start()
  await act(async () =>
    body.emit({
      event: 'message',
      task_id: 'current-task',
      message_id: 'different-message',
      data: { content: 'prefix' },
    }),
  )
  api.cancelTask.mockRejectedValue(
    new APIError(200, '109', 'private raw denial'),
  )
  await act(async () => harness.chat.handleStop())
  expect(api.cancelTask).toHaveBeenCalledExactlyOnceWith('current-task')
  expect(harness.chat.status).toBe(AgentRuntimeStatus.STOPPED)
  expect(harness.chat.lastError).toBe(
    'Stopped receiving output. The cancellation request failed. Try again later.',
  )
  expect(notifications.error).toHaveBeenCalledExactlyOnceWith(
    harness.chat.lastError,
  )
  await act(async () => {
    body.fail(new DOMException('aborted', 'AbortError'))
    await run.pending
  })
  expect(harness.chat.lastError).toContain('cancellation request failed')
})

it('before-first-frame stop only detaches and repeated stop sends no request', async () => {
  harness = await mountChat()
  const body = stream()
  api.runAgentSession.mockResolvedValue(body.response)
  const run = await harness.start()
  await act(async () => {
    await harness.chat.handleStop()
    await harness.chat.handleStop()
  })
  expect(api.cancelTask).not.toHaveBeenCalled()
  expect(harness.chat.lastError).toBe('Stopped receiving output for this run.')
  await act(async () => {
    body.end()
    await run.pending
  })
})

it.each(['new-run', 'A-B-A'] as const)(
  'late cancel error is ignored after %s',
  async (change) => {
    harness = await mountChat()
    const first = stream()
    api.runAgentSession.mockResolvedValueOnce(first.response)
    const run = await harness.start()
    await act(async () =>
      first.emit({
        event: 'message',
        task_id: 'old-task',
        data: { content: 'old' },
      }),
    )
    const cancellation = deferred<boolean>()
    api.cancelTask.mockReturnValue(cancellation.promise)
    let stopped!: Promise<void>
    await act(async () => {
      stopped = harness.chat.handleStop()
      await Promise.resolve()
    })
    if (change === 'A-B-A') {
      await harness.select('B')
      await harness.select('A')
    }
    const next = stream()
    api.runAgentSession.mockResolvedValueOnce(next.response)
    const active = await harness.start('new')
    await act(async () => {
      cancellation.reject(new Error('private late'))
      await stopped
      first.end()
      await run.pending
    })
    expect(harness.chat.status).toBe(AgentRuntimeStatus.RUNNING)
    expect(harness.chat.lastError).toBeUndefined()
    expect(notifications.error).not.toHaveBeenCalled()
    await act(async () => {
      next.emit({ event: 'message_end', data: {} })
      next.done()
      await active.pending
    })
  },
)
