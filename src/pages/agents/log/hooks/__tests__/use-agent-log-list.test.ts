import assert from 'node:assert/strict'
import test from 'node:test'
import { AgentLogStatus } from '../../types'
import {
  buildAgentSessionServerParams,
  buildNextAgentLogSearchParams,
  filterAgentLogSessions,
  readAgentLogParams,
} from '../use-agent-log-list'

test('readAgentLogParams maps URL filters and server params strip client status', () => {
  const params = readAgentLogParams(
    new URLSearchParams(
      'canvas=a1&status=err&from=2026-04-01&to=2026-04-30&page=3&pageSize=24',
    ),
  )

  assert.equal(params.status, AgentLogStatus.ERR)
  assert.deepEqual(buildAgentSessionServerParams(params), {
    page: 3,
    page_size: 24,
    keywords: '',
    from_date: '2026-04-01',
    to_date: '2026-04-30',
    exp_user_id: '',
    orderby: 'update_time',
    desc: true,
  })
})

test('buildNextAgentLogSearchParams resets page on non-page changes', () => {
  const next = buildNextAgentLogSearchParams(
    new URLSearchParams('canvas=a1&page=4&status=ok'),
    { keywords: 'foo' },
  )

  assert.equal(next.get('keywords'), 'foo')
  assert.equal(next.get('page'), '1')
  assert.equal(next.get('status'), 'ok')
})

test('buildNextAgentLogSearchParams keeps filters when only page changes', () => {
  const next = buildNextAgentLogSearchParams(
    new URLSearchParams('canvas=a1&page=1&status=err&keywords=foo'),
    { page: 2 },
  )

  assert.equal(next.get('page'), '2')
  assert.equal(next.get('status'), 'err')
  assert.equal(next.get('keywords'), 'foo')
})

test('filterAgentLogSessions applies client-side status filtering', () => {
  const sessions = [
    { id: 'ok', messages: [{ role: 'assistant', content: 'done' }] },
    { id: 'err', errors: 'failed', messages: [] },
    { id: 'run', status: 'running', messages: [] },
  ]

  assert.deepEqual(
    filterAgentLogSessions(sessions, { status: AgentLogStatus.ERR }).map(
      (s) => s.id,
    ),
    ['err'],
  )
  assert.deepEqual(
    filterAgentLogSessions(sessions, { status: AgentLogStatus.RUN }).map(
      (s) => s.id,
    ),
    ['run'],
  )
})
