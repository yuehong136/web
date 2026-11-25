import type { TFunction } from 'i18next'
import { expect, it } from 'vitest'
import type { GatewayModelHealth } from '@/api/model-gateway'
import { healthLabel } from '../components/models/model-row'

/** Names the string that was chosen and the values it was given. */
const t = ((key: string, values?: Record<string, unknown>) =>
  `${key.split('.health.')[1]}:${values?.status ?? ''}`) as unknown as TFunction

const health = (extra: Partial<GatewayModelHealth>): GatewayModelHealth => ({
  status: 'unhealthy',
  status_code: 500,
  error_message: null,
  response_time_ms: 120,
  checked_at: '2026-11-25T10:00:00Z',
  ...extra,
})

it('tells a probe that passed from real calls that succeeded', () => {
  expect(healthLabel(t, health({ status: 'healthy', status_code: 200 }))).toBe(
    'healthy:',
  )
  expect(
    healthLabel(
      t,
      health({ status: 'healthy', status_code: null, source: 'traffic' }),
    ),
  ).toBe('healthyTraffic:')
})

it('says why a model is not healthy, with the status the upstream gave', () => {
  const cases: [Partial<GatewayModelHealth>, string][] = [
    [
      { status: 'rate_limited', status_code: 429, failure_class: 'rate_limit' },
      'reasons.rate_limit:429',
    ],
    [
      { status_code: 401, failure_class: 'credential' },
      'reasons.credential:401',
    ],
    [{ status_code: 429, failure_class: 'quota' }, 'reasons.quota:429'],
    [
      { status_code: 404, failure_class: 'model_gone' },
      'reasons.model_gone:404',
    ],
    [{ status_code: 503, failure_class: 'transient' }, 'reasons.transient:503'],
    [{ status_code: null, failure_class: 'timeout' }, 'reasons.timeout:'],
    [
      { status_code: null, failure_class: 'unreachable' },
      'reasons.unreachable:',
    ],
  ]
  for (const [extra, expected] of cases)
    expect(healthLabel(t, health(extra))).toBe(expected)
})

it('still explains results from servers that send no failure class', () => {
  expect(healthLabel(t, health({ status_code: 502 }))).toBe(
    'reasons.transient:502',
  )
  expect(healthLabel(t, health({ status_code: null }))).toBe(
    'reasons.unreachable:',
  )
  expect(
    healthLabel(t, health({ status: 'rate_limited', status_code: 429 })),
  ).toBe('reasons.rate_limit:429')
  // A class this page does not know yet falls back the same way.
  expect(
    healthLabel(
      t,
      health({ status_code: 451, failure_class: 'region_blocked' }),
    ),
  ).toBe('reasons.transient:451')
})
