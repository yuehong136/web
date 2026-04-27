import assert from 'node:assert/strict'
import test from 'node:test'
import { AgentRuntimeStatus } from '../../runtime-workbench/types'
import {
  buildLiveLogDetailViewModel,
  buildSessionLogDetailViewModel,
} from '../hooks/use-log-detail'

test('live running detail does not expose trace items', () => {
  const viewModel = buildLiveLogDetailViewModel({
    controllerStatus: AgentRuntimeStatus.RUNNING,
    controllerSessionId: 'session-1',
    beginInputs: [],
    messages: [
      {
        id: 'assistant-local',
        role: 'assistant',
        content: 'streaming',
        messageId: 'message-1',
      },
    ],
    currentMessageId: 'message-1',
    traceItems: [
      {
        component_id: 'begin',
        component_name: 'Begin',
        status: 'success',
      },
    ],
  })

  assert.equal(viewModel.status, 'running')
  assert.equal(viewModel.traceItems.length, 0)
  assert.equal(viewModel.traceUnavailableReason, undefined)
})

test('live success detail includes terminal trace items', () => {
  const viewModel = buildLiveLogDetailViewModel({
    controllerStatus: AgentRuntimeStatus.SUCCESS,
    controllerSessionId: 'session-1',
    beginInputs: [],
    messages: [
      {
        id: 'assistant-local',
        role: 'assistant',
        content: 'done',
        messageId: 'message-1',
      },
    ],
    currentMessageId: 'message-1',
    traceItems: [
      {
        component_id: 'answer',
        component_name: 'Answer',
        status: 'success',
      },
    ],
  })

  assert.equal(viewModel.status, 'success')
  assert.equal(viewModel.traceItems.length, 1)
  assert.deepEqual(viewModel.latestOutput, { kind: 'text', value: 'done' })
})

test('session without latest real message id does not request trace', () => {
  const viewModel = buildSessionLogDetailViewModel({
    session: {
      id: 'session-1',
      messages: [{ id: 'assistant-123', role: 'assistant', content: 'done' }],
    },
    latestMessageId: undefined,
    traceItems: [],
  })

  assert.equal(viewModel.traceUnavailableReason, 'no-message-id')
  assert.equal(viewModel.traceItems.length, 0)
})

test('session terminal empty trace is marked redis evicted', () => {
  const viewModel = buildSessionLogDetailViewModel({
    session: {
      id: 'session-1',
      messages: [{ id: 'message-real-1', role: 'assistant', content: 'done' }],
    },
    latestMessageId: 'message-real-1',
    traceItems: [],
  })

  assert.equal(viewModel.traceUnavailableReason, 'redis-evicted')
})

test('session errors produce error status and banner message', () => {
  const viewModel = buildSessionLogDetailViewModel({
    session: {
      id: 'session-1',
      errors: 'backend failed',
      messages: [{ id: 'message-real-1', role: 'assistant', content: 'done' }],
    },
    latestMessageId: 'message-real-1',
    traceItems: [],
  })

  assert.equal(viewModel.status, 'error')
  assert.equal(viewModel.errorMessage, 'backend failed')
})
