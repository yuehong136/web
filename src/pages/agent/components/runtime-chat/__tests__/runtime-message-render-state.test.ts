import assert from 'node:assert/strict'
import test from 'node:test'
import { BeginQueryType } from '../../../constant'
import type { RuntimeMessage } from '../../../features/runtime-workbench/types'
import {
  hasRuntimeMessageRenderableContent,
  shouldShowRuntimeBubbleLoading,
} from '../runtime-message-render-state'

const createMessage = (patch: Partial<RuntimeMessage> = {}): RuntimeMessage => ({
  id: 'assistant-1',
  role: 'assistant',
  content: '',
  ...patch,
})

const createState = (patch: Partial<RuntimeMessage> = {}) => ({
  message: createMessage(patch),
  mainContent: patch.content || '',
  thinkContent: patch.thinking,
  referencesLength: patch.reference ? 1 : 0,
  hasXCard: Boolean(patch.xCardCommands?.length && patch.xCardSurfaceIds?.length),
})

test('runtime bubble loading is only used before anything renderable arrives', () => {
  assert.equal(shouldShowRuntimeBubbleLoading(createState(), true), true)
  assert.equal(shouldShowRuntimeBubbleLoading(createState(), false), false)
})

test('runtime trace events make a streaming message renderable', () => {
  const state = createState({
    logEvents: [
      {
        event: 'node_started',
        data: {
          component_id: 'begin',
          component_name: 'Begin',
        },
      },
    ],
  })

  assert.equal(hasRuntimeMessageRenderableContent(state), true)
  assert.equal(shouldShowRuntimeBubbleLoading(state, true), false)
})

test('assistant streaming artifacts make messages renderable', () => {
  const cases: Array<Partial<RuntimeMessage>> = [
    { content: 'answer' },
    { thinking: 'thinking' },
    {
      xCardCommands: [{ version: 'v0.9' } as never],
      xCardSurfaceIds: ['surface-1'],
    },
    { files: [{ name: 'report.pdf' }] },
    {
      awaitingInputs: [
        {
          key: 'query',
          name: 'Query',
          type: BeginQueryType.Line,
          value: '',
          optional: false,
        },
      ],
    },
    { error: 'failed' },
    { reference: [{ id: 'chunk-1' }] },
  ]

  cases.forEach((message) => {
    const state = createState(message)
    assert.equal(hasRuntimeMessageRenderableContent(state), true)
    assert.equal(shouldShowRuntimeBubbleLoading(state, true), false)
  })
})
