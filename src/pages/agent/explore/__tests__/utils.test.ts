import assert from 'node:assert/strict'
import test from 'node:test'
import { AgentCanvasType, type AgentFlow } from '@/types/agent'
import { AgentDialogueMode, BeginId, BeginQueryType } from '../../constant'
import {
  buildExploreSessionSearchParams,
  createDefaultExploreSessionParams,
  createTemporaryExploreSession,
  getBeginInputsFromAgent,
  isExploreTaskMode,
  mapSessionMessagesToRuntimeMessages,
  resolveExploreSessionId,
  selectNextSessionIdAfterDelete,
} from '../utils'

test('explore url params read legacy session alias and write sessionId', () => {
  const resolved = resolveExploreSessionId(
    new URLSearchParams('session=legacy-1&isNew=true'),
  )
  const next = buildExploreSessionSearchParams({
    sessionId: resolved.sessionId,
    isNew: resolved.isNew,
  })

  assert.equal(resolved.sessionId, 'legacy-1')
  assert.equal(resolved.legacySessionId, 'legacy-1')
  assert.equal(next.toString(), 'sessionId=legacy-1&isNew=true')
})

test('temporary explore session is local only and delete picks next real session', () => {
  const temporary = createTemporaryExploreSession()
  const nextSessionId = selectNextSessionIdAfterDelete(
    [
      { id: 's1', messages: [] },
      { id: 's2', messages: [] },
    ],
    's1',
  )

  assert.equal(temporary.isTemporary, true)
  assert.equal(temporary.message_count, 0)
  assert.equal(nextSessionId, 's2')
})

test('explore defaults wire pagination and ordering into session query params', () => {
  assert.deepEqual(createDefaultExploreSessionParams(), {
    page: 1,
    page_size: 12,
    orderby: 'update_time',
    desc: true,
    keywords: '',
    from_date: '',
    to_date: '',
    exp_user_id: '',
  })
})

test('explore reads begin inputs and task mode from fetched agent detail', () => {
  const agent = {
    id: 'agent-1',
    title: 'Agent',
    description: '',
    canvas_type: AgentCanvasType.AGENT,
    create_time: 1,
    update_time: 1,
    user_id: 'u1',
    permission: 'write',
    dsl: {
      components: {},
      history: [],
      messages: [],
      reference: [],
      globals: {},
      retrieval: [],
      graph: {
        nodes: [
          {
            id: BeginId,
            type: 'begin',
            position: { x: 0, y: 0 },
            data: {
              label: 'Begin',
              name: 'Begin',
              form: {
                mode: AgentDialogueMode.Task,
                inputs: {
                  query: {
                    name: 'Question',
                    type: BeginQueryType.Line,
                    value: '',
                    optional: false,
                  },
                },
              },
            },
          },
        ],
        edges: [],
      },
    },
  } satisfies AgentFlow

  assert.equal(isExploreTaskMode(agent), true)
  assert.deepEqual(getBeginInputsFromAgent(agent), [
    {
      key: 'query',
      name: 'Question',
      type: BeginQueryType.Line,
      value: '',
      optional: false,
    },
  ])
})

test('explore maps persisted session messages to runtime messages', () => {
  const messages = mapSessionMessagesToRuntimeMessages({
    id: 's1',
    messages: [
      { id: 'u1', role: 'user', content: 'hello' },
      {
        id: 'a1',
        role: 'assistant',
        content: 'answer',
        files: [{ id: 'f1', name: 'report.pdf' }],
        reference: [{ id: 'chunk-1' }],
      },
    ],
  })

  assert.equal(messages[0]?.role, 'user')
  assert.equal(messages[1]?.role, 'assistant')
  assert.equal(messages[1]?.files?.[0]?.name, 'report.pdf')
  assert.deepEqual(messages[1]?.reference, [{ id: 'chunk-1' }])
})
