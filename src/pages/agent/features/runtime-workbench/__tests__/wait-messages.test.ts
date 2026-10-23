import assert from 'node:assert/strict'
import test from 'node:test'
import type { RuntimeMessage } from '../types'
import {
  applyRuntimeUserInputs,
  clearRuntimeAwaitingInputs,
  completeRuntimeMessage,
  splitRuntimeMessages,
} from '../wait-messages'
import { mapSessionMessagesToRuntimeMessages } from '../../../explore/utils'
import { buildRuntimeInputObject } from '../utils'

const base: RuntimeMessage = {
  id: 'real-wait',
  role: 'assistant',
  content: 'Answer',
  thinking: 'Reason',
  messageId: 'event-wait',
  taskId: 'task',
  logEvents: [{ event: 'node_started', data: { component_id: 'message' } }],
}
const pause = {
  tips: 'Approve',
  inputs: {
    count: { type: 'number', value: 0 },
    approved: { type: 'boolean', value: false },
  },
}

test('only completed content preceding the form splits; errors/stream stop do not imply completion', () => {
  for (const message of [
    base,
    { ...base, isStreaming: false },
    { ...base, answerCompleted: true, content: '' },
  ]) {
    assert.equal(
      splitRuntimeMessages([applyRuntimeUserInputs(message, pause)]).length,
      1,
    )
  }
  const before = applyRuntimeUserInputs(base, pause)
  assert.equal(
    splitRuntimeMessages([completeRuntimeMessage(before, {})]).length,
    1,
  )
})

test('split keeps terminal data on answer and both explicit IDs on prompt; clearing uses exact provenance', () => {
  const answer = completeRuntimeMessage(base, {
    reference: { chunks: [{ id: 'ref' }] },
    attachment: [{ name: 'report.txt', id: 'file' }],
  })
  const source = applyRuntimeUserInputs(answer, pause)
  const collision: RuntimeMessage = {
    id: JSON.stringify(['agent-input-prompt', base.id]),
    role: 'assistant',
    content: 'Unrelated',
  }
  const other: RuntimeMessage = {
    id: 'real',
    role: 'assistant',
    content: 'Other',
    awaitingInputs: [
      { key: 'other', type: 'line', value: '', optional: false, name: 'Other' },
    ],
  }
  const rows = splitRuntimeMessages([source, collision, other])
  assert.equal(rows.length, 4)
  assert.equal(rows[0]?.content, 'Answer')
  assert.equal(rows[0]?.thinking, 'Reason')
  assert.equal(rows[0]?.files?.[0]?.name, 'report.txt')
  assert.deepEqual(rows[0]?.reference, { chunks: [{ id: 'ref' }] })
  assert.equal(rows[0]?.awaitingInputs, undefined)
  const prompt = rows[1]!
  assert.equal(prompt.content, '')
  assert.equal(prompt.tips, 'Approve')
  assert.equal(prompt.sourceMessageId, base.id)
  assert.equal(prompt.messageId, 'event-wait')
  assert.notEqual(prompt.id, collision.id)
  assert.deepEqual(buildRuntimeInputObject(prompt.awaitingInputs), {
    count: { type: 'number', value: 0, order: 0 },
    approved: { type: 'boolean', value: false, order: 1 },
  })
  const cleared = clearRuntimeAwaitingInputs(
    [source, collision, other],
    prompt.id,
  )
  assert.equal(cleared[0]?.awaitingInputs, undefined)
  assert.ok(cleared[2]?.awaitingInputs)
  assert.equal(splitRuntimeMessages(cleared)[1]?.id, prompt.id)
  assert.equal(clearRuntimeAwaitingInputs(cleared, 'unknown-wait'), cleared)
})

test('later workflow output cannot discard message-end downloads', () => {
  const answer = completeRuntimeMessage(base, {
    attachment: [{ id: 'file', name: 'report.txt' }],
  })
  const same = completeRuntimeMessage(answer, {
    attachment: [{ id: 'file', name: 'report.txt' }],
  })
  assert.equal(same.files?.length, 1)
})

test('history restores only the final pause form and preserves earlier prompt separation', () => {
  const source = mapSessionMessagesToRuntimeMessages({
    id: 'session',
    messages: [
      {
        id: 'first',
        role: 'assistant',
        content: 'First',
        runtime_pause: { ...pause, answer_completed: true },
      },
      { id: 'user', role: 'user', content: 'count: 0' },
      {
        id: 'latest-wait',
        role: 'assistant',
        content: 'Second',
        runtime_pause: { ...pause, answer_completed: true },
      },
    ],
  })
  const rows = splitRuntimeMessages(source)
  assert.equal(rows.length, 5)
  assert.equal(rows[1]?.tips, 'Approve')
  assert.equal(rows[1]?.awaitingInputs, undefined)
  assert.equal(rows[4]?.awaitingInputs?.[0]?.value, 0)
  assert.equal(rows[4]?.messageId, 'latest-wait')
})

test('same-name download records without stable identity are retained separately', () => {
  const answer = completeRuntimeMessage(base, {
    downloads: [
      { name: 'report.txt', file_id: 'first' },
      { name: 'report.txt', file_id: 'second' },
    ],
  })
  assert.deepEqual(
    answer.files?.map((file) => file.file_id),
    ['first', 'second'],
  )
})
