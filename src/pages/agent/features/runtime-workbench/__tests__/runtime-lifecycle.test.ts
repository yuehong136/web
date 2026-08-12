import assert from 'node:assert/strict'
import test from 'node:test'
import { detachRuntimeTransport, stopRuntimeRun } from '../runtime-lifecycle'

test('passive detach only aborts the local transport', () => {
  let abortCalls = 0
  let cancelCalls = 0
  const lifecycleProbe = {
    abort: () => {
      abortCalls += 1
    },
    cancelRun: () => {
      cancelCalls += 1
    },
  }

  detachRuntimeTransport(lifecycleProbe)

  assert.equal(abortCalls, 1)
  assert.equal(cancelCalls, 0)
})

test('explicit stop aborts the transport before cancelling the server run', async () => {
  const calls: string[] = []
  const transport = {
    abort: () => {
      calls.push('abort')
    },
  }

  await stopRuntimeRun(transport, 'task-1', async (taskId) => {
    calls.push(`cancel:${taskId}`)
  })

  assert.deepEqual(calls, ['abort', 'cancel:task-1'])
})
