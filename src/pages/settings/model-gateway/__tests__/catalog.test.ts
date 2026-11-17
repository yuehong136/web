import { describe, expect, it } from 'vitest'
import type {
  GatewayCatalog,
  GatewayCatalogModel,
  GatewayKey,
} from '@/api/model-gateway'
import {
  callableModels,
  connectionCheck,
  emptyScope,
  groupCatalog,
  modelChecked,
  scopeByProvider,
  scopeGrants,
  scopePayload,
  staleGrants,
  toggleConnection,
  toggleModel,
  unsupportedProviders,
  type KeyScope,
} from '../catalog'
import { buildKeyInput, initialDraft } from '../components/key-form/key-draft'

const model = (
  overrides: Partial<GatewayCatalogModel> &
    Pick<GatewayCatalogModel, 'model_id'>,
): GatewayCatalogModel => ({
  model_name: `m${overrides.model_id}`,
  provider: 'Tongyi-Qianwen',
  instance_id: 'tq',
  instance_name: 'default',
  model_types: ['chat'],
  servable_types: ['chat'],
  state: 'callable',
  reason: null,
  enabled: true,
  enabled_by_default: true,
  call_name: `m${overrides.model_id}`,
  names: [`m${overrides.model_id}`],
  alias: null,
  preferred: false,
  shares_name: false,
  description: null,
  rpm_limit: null,
  tpm_limit: null,
  max_parallel_requests: null,
  requests_7d: 0,
  ...overrides,
})

const catalog: GatewayCatalog = {
  new_models_enabled: true,
  connections: [
    { instance_id: 'tq', instance_name: 'default', provider: 'Tongyi-Qianwen' },
    { instance_id: 'vl', instance_name: 'gpu-a', provider: 'VLLM' },
    { instance_id: 'empty', instance_name: 'spare', provider: 'VLLM' },
    { instance_id: 'zp', instance_name: 'default', provider: 'ZHIPU-AI' },
  ],
  models: [
    model({ model_id: 1 }),
    model({ model_id: 2, state: 'closed', enabled: false }),
    model({
      model_id: 3,
      model_types: ['rerank'],
      servable_types: [],
      state: 'unavailable',
      reason: 'endpoint_not_supported',
    }),
    model({
      model_id: 11,
      provider: 'VLLM',
      instance_id: 'vl',
      instance_name: 'gpu-a',
    }),
    model({
      model_id: 12,
      provider: 'VLLM',
      instance_id: 'vl',
      instance_name: 'gpu-a',
      model_types: ['embedding'],
    }),
    model({
      model_id: 21,
      provider: 'ZHIPU-AI',
      instance_id: 'zp',
      state: 'unavailable',
      reason: 'provider_not_supported',
    }),
  ],
}

const tq = () => groupCatalog(catalog)[0].connections[0]
const vl = () => groupCatalog(catalog)[1].connections[0]
const scope = (patch: Partial<KeyScope>): KeyScope => ({
  ...emptyScope(),
  ...patch,
})

describe('catalog grouping', () => {
  it('groups by provider then connection and leaves out empty connections', () => {
    const groups = groupCatalog(catalog)
    expect(groups.map((group) => group.provider)).toEqual([
      'Tongyi-Qianwen',
      'VLLM',
      'ZHIPU-AI',
    ])
    expect(groups[1].connections.map((item) => item.instance_id)).toEqual([
      'vl',
    ])
    expect(
      groups[0].connections[0].models.map((item) => item.model_id),
    ).toEqual([1, 2, 3])
  })

  it('marks a provider unsupported only when every model is not relayed', () => {
    expect([...unsupportedProviders(catalog)]).toEqual(['ZHIPU-AI'])
    expect(groupCatalog(catalog).map((group) => group.unsupported)).toEqual([
      false,
      false,
      true,
    ])
  })
})

describe('key scope', () => {
  it('reaches whole connections and picked models, callable ones only', () => {
    const picked = scope({ instanceIds: ['vl'], modelIds: [1, 2] })
    expect(
      callableModels(catalog, picked).map((item) => item.model_id),
    ).toEqual([1, 11, 12])
    expect(
      callableModels(catalog, scope({ allModels: true })).map(
        (item) => item.model_id,
      ),
    ).toEqual([1, 11, 12])
  })

  it('counts deleted and uncallable grants and deleted connections as stale', () => {
    const stale = staleGrants(
      catalog,
      scope({ instanceIds: ['vl', 'gone'], modelIds: [1, 2, 99] }),
    )
    expect(stale.deletedModelIds).toEqual([99])
    expect(stale.unavailableModels.map((item) => item.model_id)).toEqual([2])
    // A connection without models still exists; only an unknown id is gone.
    expect(stale.deletedInstanceIds).toEqual(['gone'])
    expect(stale.count).toBe(3)
    expect(staleGrants(catalog, scope({ instanceIds: ['empty'] })).count).toBe(
      0,
    )
    expect(
      staleGrants(catalog, scope({ allModels: true, modelIds: [99] })).count,
    ).toBe(0)
  })

  it('summarises a custom scope per provider', () => {
    expect(
      scopeByProvider(catalog, scope({ instanceIds: ['tq'], modelIds: [11] })),
    ).toEqual([
      { provider: 'Tongyi-Qianwen', whole: true, count: 3 },
      { provider: 'VLLM', whole: false, count: 1 },
    ])
    // VLLM has two connections; granting one is not the whole provider.
    expect(scopeByProvider(catalog, scope({ instanceIds: ['vl'] }))).toEqual([
      { provider: 'VLLM', whole: false, count: 2 },
    ])
  })

  it('lists grants by connection and strikes out uncallable picks', () => {
    const grants = scopeGrants(
      catalog,
      scope({ instanceIds: ['empty'], modelIds: [1, 2] }),
    )
    expect(grants).toEqual([
      {
        provider: 'Tongyi-Qianwen',
        connections: [
          {
            instanceId: 'tq',
            instanceName: 'default',
            whole: false,
            models: [
              { model: catalog.models[0], stale: false },
              { model: catalog.models[1], stale: true },
            ],
          },
        ],
      },
      {
        provider: 'VLLM',
        connections: [
          {
            instanceId: 'empty',
            instanceName: 'spare',
            whole: true,
            models: [],
          },
        ],
      },
    ])
  })
})

describe('scope picker', () => {
  it('shows a whole connection as checked and some picks as mixed', () => {
    expect(connectionCheck(scope({ instanceIds: ['tq'] }), tq())).toBe(
      'checked',
    )
    expect(connectionCheck(scope({ modelIds: [1] }), tq())).toBe('mixed')
    expect(connectionCheck(emptyScope(), tq())).toBe('unchecked')
    // In a whole connection only callable models read as checked.
    const whole = scope({ instanceIds: ['tq'] })
    expect(
      catalog.models.slice(0, 3).map((item) => modelChecked(whole, item)),
    ).toEqual([true, false, false])
  })

  it('checks a connection as a whole, folding its picks in', () => {
    const next = toggleConnection(scope({ modelIds: [1, 11] }), tq())
    expect(next).toEqual(scope({ instanceIds: ['tq'], modelIds: [11] }))
    expect(toggleConnection(next, tq())).toEqual(scope({ modelIds: [11] }))
  })

  it('turns a whole connection into explicit picks when one model is unchecked', () => {
    const next = toggleModel(
      scope({ instanceIds: ['vl'] }),
      vl(),
      catalog.models[3],
    )
    expect(next).toEqual(scope({ modelIds: [12] }))
    expect(toggleModel(next, vl(), catalog.models[3])).toEqual(
      scope({ modelIds: [12, 11] }),
    )
  })

  it('drops ids the tenant no longer owns and sends empty lists for all models', () => {
    expect(
      scopePayload(
        catalog,
        scope({ instanceIds: ['vl', 'gone'], modelIds: [1, 99] }),
      ),
    ).toEqual({
      allow_all_models: false,
      allowed_instance_ids: ['vl'],
      allowed_model_ids: [1],
    })
    expect(
      scopePayload(catalog, scope({ allModels: true, modelIds: [1] })),
    ).toEqual({
      allow_all_models: true,
      allowed_instance_ids: [],
      allowed_model_ids: [],
    })
  })
})

describe('key draft', () => {
  const key: GatewayKey = {
    id: 'k1',
    name: 'support-bot',
    description: null,
    tags: null,
    redacted_key: 'sk-mrag-k1…',
    status: 'active',
    expires_at: '2026-01-01T00:00:00.000Z',
    allow_all_models: false,
    allowed_instance_ids: ['tq'],
    allowed_model_ids: [11],
    rpm_limit: 60,
    tpm_limit: null,
    max_parallel_requests: null,
    token_quota: null,
    quota_period: null,
    quota_used: null,
    last_used_at: null,
    create_time: 1,
    update_time: 1,
  }
  const now = Date.parse('2026-11-17T00:00:00Z')

  it('does not resend an unchanged expiry, even one in the past', () => {
    const request = { mode: 'edit' as const, key }
    const result = buildKeyInput(
      initialDraft(request, (name) => name, now),
      request,
      catalog,
      now,
    )
    expect(result).toEqual({
      ok: true,
      input: {
        name: 'support-bot',
        description: null,
        allow_all_models: false,
        allowed_instance_ids: ['tq'],
        allowed_model_ids: [11],
        rpm_limit: 60,
        tpm_limit: null,
        max_parallel_requests: null,
        token_quota: null,
        quota_period: null,
      },
    })
  })

  it('rotates under a new name and drops an expiry already passed', () => {
    const request = { mode: 'rotate' as const, key }
    const draft = initialDraft(request, (name) => `${name} (2)`, now)
    expect(draft.name).toBe('support-bot (2)')
    expect(draft.expiry).toEqual({ preset: 'never', custom: '' })
    const result = buildKeyInput(draft, request, catalog, now)
    expect(result.ok && result.input.expires_at).toBeNull()
  })

  it('requires a name', () => {
    const request = { mode: 'create' as const }
    expect(
      buildKeyInput(
        initialDraft(request, (name) => name),
        request,
        catalog,
      ),
    ).toEqual({
      ok: false,
      errorKey: 'settings.modelGateway.errors.nameRequired',
    })
  })
})
