import type { TFunction } from 'i18next'
import { expect, it } from 'vitest'
import type {
  GatewayCatalogModel,
  GatewayModelHealth,
} from '@/api/model-gateway'
import { modelLogoProvider } from '../components/models/model-identity'
import { modelStatusView } from '../components/models/model-status'

/** Names the string that was chosen, without its values. */
const t = ((key: string) =>
  key.split('.models.')[1] ?? key) as unknown as TFunction

const health = (extra: Partial<GatewayModelHealth>): GatewayModelHealth => ({
  status: 'healthy',
  status_code: 200,
  error_message: null,
  response_time_ms: 420,
  checked_at: '2026-11-25T10:00:00Z',
  ...extra,
})

const model = (extra: Partial<GatewayCatalogModel>) =>
  ({
    state: 'callable',
    reason: null,
    health: null,
    ...extra,
  }) as GatewayCatalogModel

it('shows a healthy model by how fast it answered', () => {
  const view = modelStatusView(t, model({ health: health({}) }))
  expect([view.tone, view.label]).toEqual(['success', '420 ms'])
  expect(view.detail).toBe('health.healthy')
  // Real calls vouch for the model, but there is no probe time to show.
  expect(
    modelStatusView(t, model({ health: health({ source: 'traffic' }) })).label,
  ).toBe('status.healthy')
})

it('names the trouble in a word and keeps a rate limit apart from failures', () => {
  const limited = modelStatusView(
    t,
    model({
      health: health({
        status: 'rate_limited',
        status_code: 429,
        failure_class: 'rate_limit',
      }),
    }),
  )
  expect([limited.tone, limited.label]).toEqual([
    'warning',
    'status.rate_limit',
  ])
  const gone = modelStatusView(
    t,
    model({
      health: health({
        status: 'unhealthy',
        status_code: 404,
        failure_class: 'model_gone',
      }),
    }),
  )
  expect([gone.tone, gone.label, gone.detail]).toEqual([
    'danger',
    'status.model_gone',
    'health.reasons.model_gone',
  ])
})

it('says so when a model is closed, unavailable or not checked yet', () => {
  expect(modelStatusView(t, model({})).label).toBe('status.unchecked')
  // A closed model is not judged by a check made while it was open.
  const closed = modelStatusView(
    t,
    model({ state: 'closed', health: health({ status: 'unhealthy' }) }),
  )
  expect([closed.tone, closed.label]).toEqual(['neutral', 'status.closed'])
  expect(
    modelStatusView(
      t,
      model({ state: 'unavailable', reason: 'model_disabled' }),
    ).label,
  ).toBe('status.unavailable')
})

it('shows the brand in a model name when the app knows it, else its provider', () => {
  const relay = 'Tongyi-Qianwen'
  // Recognised by the app's shared logo resolver, the one chat answers use.
  expect(
    modelLogoProvider({ model_name: 'deepseek-v3.2', provider: relay }),
  ).toBe('deepseek-v3.2')
  expect(
    modelLogoProvider({
      model_name: 'Moonshot-Kimi-K2-Instruct',
      provider: relay,
    }),
  ).toBe('Moonshot-Kimi-K2-Instruct')
  // Nothing in the name to go by: the model keeps its provider's logo.
  expect(modelLogoProvider({ model_name: 'qwen-plus', provider: relay })).toBe(
    relay,
  )
  expect(
    modelLogoProvider({ model_name: 'my-finetune-7', provider: 'VLLM' }),
  ).toBe('VLLM')
})
