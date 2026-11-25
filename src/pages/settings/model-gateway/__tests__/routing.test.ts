import { expect, it } from 'vitest'
import type { GatewayCatalogModel } from '@/api/model-gateway'
import {
  parseRoutingDraft,
  retriesOf,
  routingDraftOf,
  widestPool,
} from '../routing'

const model = (extra: Partial<GatewayCatalogModel> = {}) =>
  ({ weight: 1, order: null, pools: [], ...extra }) as GatewayCatalogModel

it('shows an unset order as empty and the weight as its number', () => {
  expect(routingDraftOf(model())).toEqual({ order: '', weight: '1' })
  expect(routingDraftOf(model({ order: 2, weight: 5 }))).toEqual({
    order: '2',
    weight: '5',
  })
})

it('sends only the routing fields that changed', () => {
  expect(parseRoutingDraft({ order: '', weight: '1' }, model())).toEqual({})
  expect(parseRoutingDraft({ order: '1', weight: '3' }, model())).toEqual({
    order: 1,
    weight: 3,
  })
  expect(
    parseRoutingDraft({ order: '2', weight: '4' }, model({ order: 2 })),
  ).toEqual({ weight: 4 })
})

it('clears the order and returns the weight to its default when emptied', () => {
  const routed = model({ order: 2, weight: 5 })
  expect(parseRoutingDraft({ order: '', weight: '' }, routed)).toEqual({
    order: null,
    weight: null,
  })
  // An empty weight on a model that already has the default changes nothing.
  expect(parseRoutingDraft({ order: '', weight: '' }, model())).toEqual({})
})

it('rejects orders and weights outside what the gateway accepts', () => {
  for (const order of ['0', '101', '1.5', '-1', 'first'])
    expect(parseRoutingDraft({ order, weight: '1' }, model())).toBe(null)
  for (const weight of ['0', '1001', 'x'])
    expect(parseRoutingDraft({ order: '', weight }, model())).toBe(null)
})

it('names the pool a model shares with the most others', () => {
  expect(widestPool(model())).toBe(null)
  expect(
    widestPool(
      model({
        pools: [
          { name: 'VLLM/qwen', deployments: 2 },
          { name: 'qwen', deployments: 3 },
        ],
      }),
    ),
  ).toEqual({ name: 'qwen', deployments: 3 })
  // Servers before deployments existed send no pools at all.
  expect(widestPool({} as GatewayCatalogModel)).toBe(null)
})

it('counts the upstream calls a request made beyond its first', () => {
  const attempt = {
    model_id: 'a',
    model_name: 'qwen',
    provider: 'VLLM',
    status_code: 503,
    error_code: null,
    duration_ms: 12,
  }
  expect(retriesOf({})).toBe(0)
  expect(retriesOf({ attempts: null })).toBe(0)
  expect(retriesOf({ attempts: [attempt, attempt, attempt] })).toBe(2)
})
