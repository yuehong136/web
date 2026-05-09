import assert from 'node:assert/strict'
import test from 'node:test'
import { AgentCanvasCategory, AgentCanvasType } from '@/types/agent'
import { AGENT_LOG_CSV_COLUMNS } from '../../constants'
import {
  buildAgentLogCsv,
  buildAgentLogCsvFilename,
  escapeCsvCell,
} from '../use-agent-log-export'

test('buildAgentLogCsv emits the exact header columns', () => {
  const csv = buildAgentLogCsv({
    canvasId: 'canvas-1',
    sessions: [],
  })

  assert.equal(csv, AGENT_LOG_CSV_COLUMNS.join(','))
})

test('buildAgentLogCsv derives error summary and row fields', () => {
  const csv = buildAgentLogCsv({
    canvasId: 'canvas-1',
    agent: {
      id: 'canvas-1',
      title: '客服 Agent',
      description: '',
      canvas_type: AgentCanvasType.AGENT,
      canvas_category: AgentCanvasCategory.AGENT,
      create_time: 0,
      update_time: 0,
      user_id: 'u1',
      permission: 'me',
      dsl: {
        graph: { nodes: [], edges: [] },
        components: {},
        history: [],
        messages: [],
        reference: [],
        globals: {},
        retrieval: [],
      },
    },
    sessions: [
      {
        id: 's1',
        canvas_id: 'canvas-1',
        errors: 'tool failed',
        source: 'explore',
        round: 2,
        duration: 1200,
        tokens: 42,
        message_count: 2,
        messages: [
          { role: 'user', content: 'hello' },
          { role: 'assistant', content: 'world' },
        ],
        create_date: '2026-04-01T00:00:00Z',
        update_date: '2026-04-01T00:01:00Z',
      },
    ],
  })

  assert.match(csv, /tool failed/)
  assert.match(csv, /客服 Agent/)
  assert.match(csv, /失败/)
})

test('escapeCsvCell escapes commas quotes and newlines', () => {
  assert.equal(escapeCsvCell('a,b'), '"a,b"')
  assert.equal(escapeCsvCell('a"b'), '"a""b"')
  assert.equal(escapeCsvCell('a\nb'), '"a\nb"')
})

test('buildAgentLogCsvFilename uses canvas id and date', () => {
  assert.equal(
    buildAgentLogCsvFilename('canvas-1', new Date('2026-04-05T12:00:00Z')),
    'agent-sessions-canvas-1-2026-04-05.csv',
  )
})
