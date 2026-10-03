import assert from 'node:assert/strict'
import test from 'node:test'
import { AgentCanvasType, type AgentFlow } from '@/types/agent'
import { AgentDialogueMode, BeginId, BeginQueryType } from '../../constant'
import {
  buildExploreSessionSearchParams,
  createDefaultExploreSessionParams,
  createTemporaryExploreSession,
  getBeginInputsFromAgent,
  getExploreSessionGroup,
  getExploreSessionTitle,
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

test('explore display title preserves named sessions and derives default names from user text', () => {
  const session = {
    id: 's1',
    name: '  New session  ',
    messages: [
      { role: 'system', content: 'Private system instructions' },
      { role: 'tool', content: 'Tool result' },
      { role: 'assistant', content: 'Assistant prologue' },
      { role: 'user', content: '   \n\t ' },
      {
        role: 'user',
        content:
          '# **Summarize** [the report](https://example.com)\n\n  in <b>three</b> lines',
      },
      { role: 'user', content: 'A later request' },
    ],
  }
  const original = structuredClone(session)
  assert.equal(
    getExploreSessionTitle(session, 'Untitled · s1'),
    'Summarize the report in three lines',
  )
  assert.deepEqual(session, original)
  assert.equal(
    getExploreSessionTitle({ ...session, name: ' Team research ' }, 'Untitled'),
    'Team research',
  )
  for (const name of [
    '新会话',
    '未命名会话',
    'NEW SESSION',
    'Untitled conversation',
    '',
  ]) {
    assert.equal(
      getExploreSessionTitle({ ...session, name }, 'Untitled'),
      'Summarize the report in three lines',
    )
  }
})

test('explore display titles ignore structured content and preserve the caller fallback', () => {
  const session = {
    id: 's2',
    messages: [
      { role: 'system', content: 'Do not use me' },
      { role: 'tool', content: 'Do not use me either' },
      { role: 'user', content: { private: 'structured payload' } },
      { role: 'user', content: ['structured', 'array'] },
    ],
  }
  // Unknown server payloads can contain non-text content despite the UI contract.
  assert.equal(
    getExploreSessionTitle(
      session as unknown as Parameters<typeof getExploreSessionTitle>[0],
      'Untitled · s2',
    ),
    'Untitled · s2',
  )
  assert.equal(getExploreSessionTitle(undefined, 'Untitled'), 'Untitled')
  assert.equal(
    getExploreSessionTitle(
      { id: 's3', messages: [{ content: 'No explicit user role' }] },
      'Untitled · s3',
    ),
    'Untitled · s3',
  )
})

test('explore derived titles are whitespace-normalized and truncate without splitting Unicode', () => {
  const title = getExploreSessionTitle(
    {
      id: 's1',
      messages: [{ role: 'user', content: `  ${'😀'.repeat(70)}  \n ` }],
    },
    'Untitled',
  )
  assert.equal(Array.from(title).length, 60)
  assert.equal(title, `${'😀'.repeat(59)}…`)
  assert.equal(
    getExploreSessionTitle(
      {
        id: 's2',
        messages: [{ role: 'user', content: 'one\n\t two   three' }],
      },
      'Untitled',
    ),
    'one two three',
  )
})

test('explore title cleanup bounds long malformed Markdown before deriving a stable title', () => {
  const malformed = '['.repeat(200_000)
  assert.equal(
    getExploreSessionTitle(
      { id: 'malformed', messages: [{ role: 'user', content: malformed }] },
      'Untitled',
    ),
    `${'['.repeat(59)}…`,
  )
  assert.equal(
    getExploreSessionTitle(
      {
        id: 'bounded',
        messages: [
          {
            role: 'user',
            content: `**Useful question**${' '.repeat(10_000)}late text`,
          },
        ],
      },
      'Untitled',
    ),
    'Useful question',
  )
})

test('an empty inspected title prefix falls through to the next user text or caller fallback', () => {
  const blankPrefix = {
    role: 'user',
    content: `${' '.repeat(5000)}outside inspected prefix`,
  }
  assert.equal(
    getExploreSessionTitle(
      {
        id: 'blank',
        messages: [
          blankPrefix,
          { role: 'user', content: 'Next visible request' },
        ],
      },
      'Untitled · blank',
    ),
    'Next visible request',
  )
  assert.equal(
    getExploreSessionTitle(
      { id: 'blank', messages: [blankPrefix] },
      'Untitled · blank',
    ),
    'Untitled · blank',
  )
  assert.equal(
    getExploreSessionTitle(
      {
        id: 'boundary',
        messages: [{ role: 'user', content: `${' '.repeat(4095)}😀` }],
      },
      'Untitled · boundary',
    ),
    'Untitled · boundary',
  )
})

test('explore session date groups use the selected millisecond field and calendar boundaries', () => {
  const now = new Date(2026, 9, 3, 12).getTime()
  const day = (offset: number, hour = 12) =>
    new Date(2026, 9, 3 + offset, hour).getTime()
  for (const [timestamp, group] of [
    [day(0, 0), 'today'],
    [day(0, 23), 'today'],
    [day(-1, 0), 'yesterday'],
    [day(-1, 23), 'yesterday'],
    [day(-2), 'previous7Days'],
    [day(-7, 0), 'previous7Days'],
    [day(-8), 'previous30Days'],
    [day(-30, 0), 'previous30Days'],
    [day(-31), '2026-09'],
    [day(1), '2026-10'],
  ] as const) {
    assert.equal(
      getExploreSessionGroup(
        { id: 's1', update_time: timestamp },
        'update_time',
        now,
      ),
      group,
    )
  }
  const session = { id: 's2', create_time: day(-1), update_time: day(0) }
  assert.equal(getExploreSessionGroup(session, 'create_time', now), 'yesterday')
  assert.equal(getExploreSessionGroup(session, 'update_time', now), 'today')
  assert.equal(getExploreSessionGroup(session, 'name', now), undefined)
  assert.equal(getExploreSessionGroup(session, 'unknown_order', now), undefined)
})

test('explore session grouping distinguishes invalid dates and never borrows another timestamp', () => {
  const now = new Date(2026, 9, 3, 12).getTime()
  for (const timestamp of [
    undefined,
    0,
    -1,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    1e20,
  ]) {
    assert.equal(
      getExploreSessionGroup(
        { id: 's1', update_time: timestamp, create_time: now },
        'update_time',
        now,
      ),
      'undated',
    )
  }
  assert.equal(getExploreSessionGroup(undefined, 'update_time', now), 'undated')
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
        downloads: [
          {
            doc_id: 'd1',
            filename: 'generated.docx',
            mime_type:
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          },
        ],
        reference: [{ id: 'chunk-1' }],
      },
    ],
  })

  assert.equal(messages[0]?.role, 'user')
  assert.equal(messages[1]?.role, 'assistant')
  assert.equal(messages[1]?.files?.[0]?.name, 'report.pdf')
  assert.equal(messages[1]?.files?.[1]?.name, 'generated.docx')
  assert.deepEqual(messages[1]?.reference, [{ id: 'chunk-1' }])
})

test('reloaded strict failure gets fixed feedback without a saved successful assistant answer', () => {
  const session = {
    id: 'strict',
    errors: 'private range error',
    messages: [
      { role: 'assistant', content: 'prologue' },
      { role: 'user', content: 'run' },
    ],
  }
  const original = structuredClone(session)
  const messages = mapSessionMessagesToRuntimeMessages(
    session,
    'The run failed.',
  )
  assert.equal(messages.at(-1)?.error, 'The run failed.')
  assert.equal(messages.at(-1)?.content, 'The run failed.')
  assert.equal(JSON.stringify(messages).includes('private'), false)
  assert.deepEqual(session, original)
})

test('published new-session intent survives URL construction without becoming a revision', () => {
  const params = buildExploreSessionSearchParams({
    isNew: true,
    mode: 'published',
  })
  assert.equal(params.get('runMode'), 'published')
  assert.equal(params.get('isNew'), 'true')
  assert.equal(params.has('agent_revision_id'), false)
  assert.equal(resolveExploreSessionId(params).sessionId, '')
})
