import { apiClient } from '@/api/client'
import { API_BASE_URL } from '@/constants'

/**
 * Management API of the model gateway. The backend contract is documented in
 * `MultiRAG:docs/model-gateway/README.md`.
 *
 * The routes exist only while the gateway is enabled on the server. A 404
 * therefore means "not enabled", which callers detect with
 * `isMissingRouteError` instead of treating it as a failure.
 */
const rest = { baseURL: `${API_BASE_URL}/api` }
const base = '/v1/model-gateway'

const path = (segment: string, id?: string | number) =>
  id === undefined
    ? `${base}/${segment}`
    : `${base}/${segment}/${encodeURIComponent(String(id))}`

/** Capabilities the gateway can serve today. */
export const GATEWAY_CAPABILITIES = ['chat', 'embedding'] as const
export type GatewayCapability = (typeof GATEWAY_CAPABILITIES)[number]
export type GatewayModelState = 'callable' | 'closed' | 'unavailable'
export type GatewayUnavailableReason =
  'provider_not_supported' | 'endpoint_not_supported' | 'model_disabled'
export type GatewayKeyStatus = 'active' | 'disabled' | 'revoked'
export type GatewayQuotaPeriod = 'day' | 'month'
export type GatewayUsageGroup = 'key' | 'model' | 'day' | 'end_user'
export type GatewayLogOutcome = 'success' | 'error'
/** Days covered by the overview window. */
export const GATEWAY_WINDOWS = [1, 7, 30] as const
export type GatewayWindow = (typeof GATEWAY_WINDOWS)[number]

/** `null` means unlimited. */
export interface GatewayRateLimits {
  rpm_limit: number | null
  tpm_limit: number | null
  max_parallel_requests: number | null
}

/** US dollars per token, under LiteLLM's field names. */
export interface GatewayPriceRates {
  input_cost_per_token: number
  output_cost_per_token: number
  /** `null` charges cached prompt tokens like any other prompt token. */
  cache_read_input_token_cost: number | null
}

/** The price calls of a model are charged at. */
export interface GatewayPricing extends GatewayPriceRates {
  /** The operator's own price, or LiteLLM's cost map. */
  source: 'custom' | 'litellm' | (string & {})
  /** Larger prompts are charged at other rates than the ones shown. */
  tiered: boolean
}

/** A registered model as the gateway sees it; there is no publish step. */
export interface GatewayCatalogModel extends GatewayRateLimits {
  model_id: string
  model_name: string
  provider: string
  instance_id: string
  instance_name: string
  model_types: string[]
  servable_types: GatewayCapability[]
  state: GatewayModelState
  reason: GatewayUnavailableReason | null
  /** The open switch; it follows `new_models_enabled` until set explicitly. */
  enabled: boolean
  enabled_by_default: boolean
  /** The primary name, always `names[0]`. */
  call_name: string
  /** Every name that reaches this model, primary first. */
  names: string[]
  alias: string | null
  preferred: boolean
  /** Another registered model has the same `model_name`. */
  shares_name: boolean
  /** Share of traffic among deployments of one order; absent on older servers. */
  weight?: number
  /** The lowest order is tried first; `null` comes after every ordered model. */
  order?: number | null
  /** Names this model serves together with other callable models. */
  pools?: GatewayPool[]
  /** The latest background health check; `null` while checks are off. */
  health?: GatewayModelHealth | null
  description: string | null
  requests_7d: number
  /** `null` when nobody priced the model; absent on older servers. */
  pricing?: GatewayPricing | null
  /** The operator's price, when one is set. */
  custom_pricing?: GatewayPriceRates | null
  max_input_tokens?: number | null
  max_output_tokens?: number | null
}

export type GatewayFailureClass =
  | 'rate_limit'
  | 'credential'
  | 'quota'
  | 'model_gone'
  | 'transient'
  | 'timeout'
  | 'unreachable'

/** What the last background health check of a model found. */
export interface GatewayModelHealth {
  /** Rate limited is a state of its own: it passes without anyone fixing anything. */
  status: 'healthy' | 'rate_limited' | 'unhealthy' | (string & {})
  /** Why it is not healthy; absent on older servers. */
  failure_class?: GatewayFailureClass | (string & {}) | null
  /** A probe, or real calls that succeeded since the last check. */
  source?: 'probe' | 'traffic' | (string & {})
  /** The upstream's answer; `null` when it could not be reached in time. */
  status_code: number | null
  error_message: string | null
  response_time_ms: number
  checked_at: string | null
}

/** A name several callable models serve; each is a deployment of it. */
export interface GatewayPool {
  name: string
  deployments: number
}

/** One upstream call of a request that made more than one. */
export interface GatewayAttempt {
  model_id: string
  model_name: string
  provider: string
  /** The connection the deployment is registered under. */
  instance_name?: string
  status_code: number
  error_code: string | null
  duration_ms: number
}

/** A provider connection (model instance), with or without models. */
export interface GatewayConnection {
  instance_id: string
  instance_name: string
  provider: string
}

export interface GatewayCatalog {
  new_models_enabled: boolean
  connections: GatewayConnection[]
  models: GatewayCatalogModel[]
}

export interface GatewayCatalogModelUpdate extends Partial<GatewayRateLimits> {
  enabled?: boolean
  alias?: string | null
  preferred?: boolean
  description?: string | null
  /** LiteLLM's `weight` and `order`; `null` returns to the default. */
  weight?: number | null
  order?: number | null
  /** Exact decimal strings; `null` returns the model to LiteLLM's price. */
  input_cost_per_token?: string | null
  output_cost_per_token?: string | null
  cache_read_input_token_cost?: string | null
}

export interface GatewayKey extends GatewayRateLimits {
  id: string
  name: string
  description: string | null
  tags: Record<string, string> | null
  /** Display form only; the secret itself is never returned again. */
  redacted_key: string
  status: GatewayKeyStatus
  expires_at: string | null
  /** Every open model, including ones opened later. */
  allow_all_models: boolean
  /** Whole connections, including models opened there later. */
  allowed_instance_ids: string[]
  /** Registered model ids: a snapshot, later models are not included. */
  allowed_model_ids: string[]
  token_quota: number | null
  quota_period: GatewayQuotaPeriod | null
  /** Tokens used in the current period; `null` for keys without a quota. */
  quota_used: number | null
  last_used_at: string | null
  /** When the secret was last replaced; absent on older servers. */
  rotated_at?: string | null
  /** Until when the secret replaced by the last rotation still works. */
  previous_key_expires_at?: string | null
  create_time: number | null
  update_time: number | null
}

/** The creation response is the only place the plaintext key ever appears. */
export interface GatewayKeyCreated extends GatewayKey {
  key: string
}

/** The quota and its period are always sent together (both set or both null). */
export interface GatewayKeyLimitsInput extends Partial<GatewayRateLimits> {
  token_quota?: number | null
  quota_period?: GatewayQuotaPeriod | null
}

export interface GatewayKeyScopeInput {
  allow_all_models?: boolean
  allowed_instance_ids?: string[]
  allowed_model_ids?: string[]
}

export interface GatewayKeyCreateInput
  extends GatewayKeyLimitsInput, GatewayKeyScopeInput {
  name: string
  description?: string | null
  expires_at?: string | null
}

export interface GatewayKeyUpdateInput
  extends GatewayKeyLimitsInput, GatewayKeyScopeInput {
  name?: string
  description?: string | null
  expires_at?: string | null
  status?: 'active' | 'disabled'
}

export interface GatewayLog {
  id: string
  key_id: string
  key_name: string
  /** The name the caller sent. */
  model: string | null
  gateway_model_id: string | null
  /** The registered model that served the call. */
  upstream_model_id: string | null
  upstream_model_name: string | null
  endpoint: string
  stream: boolean
  status_code: number
  error_type: string | null
  error_code: string | null
  /** Token counts are `null` when the upstream did not report usage. */
  prompt_tokens: number | null
  completion_tokens: number | null
  total_tokens: number | null
  /** Prompt tokens served from the upstream's cache. */
  cache_read_input_tokens?: number | null
  /** US dollars; `null` when the model has no price or the usage is unknown. */
  cost?: number | null
  /** Every upstream call, in order, when the request made more than one. */
  attempts?: GatewayAttempt[] | null
  usage_source: 'reported' | 'estimated' | 'unavailable' | (string & {})
  started_at: string | null
  first_token_ms: number | null
  duration_ms: number
  end_user: string | null
  client_ip: string | null
}

export interface GatewayLogPage {
  items: GatewayLog[]
  total: number
  page: number
  page_size: number
}

export interface GatewayLogQuery {
  page: number
  page_size: number
  key_id?: string
  model?: string
  end_user?: string
  outcome?: GatewayLogOutcome
  /** An exact HTTP status, e.g. 429. */
  status_code?: number
  start?: string
  end?: string
}

export interface GatewayUsageRow {
  key_id?: string
  key_name?: string
  model?: string | null
  day?: string | null
  end_user?: string | null
  requests: number
  errors: number
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  /** Calls whose usage is unknown and therefore missing from the token sums. */
  usage_unknown: number
}

export interface GatewayUsage {
  group_by: GatewayUsageGroup
  start: string
  end: string
  items: GatewayUsageRow[]
}

export interface GatewayUsageQuery {
  group_by: GatewayUsageGroup
  key_id?: string
  model?: string
  start?: string
  end?: string
}

export interface GatewayOverviewTotals {
  requests: number
  errors: number
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  usage_unknown: number
  /** US dollars; calls of unpriced models add nothing. Absent on older servers. */
  spend?: number
  /** Median first-token latency of streamed calls; `null` when none. */
  first_token_p50_ms: number | null
}

export interface GatewayOverviewBucket {
  start: string
  requests: number
  errors: number
  /** Tokens of the calls with known usage; absent on older servers. */
  total_tokens?: number
  spend?: number
}

export interface GatewayOverview {
  /** `null` when the data plane listens on a wildcard host. */
  base_url: string | null
  listen_port: number
  data_plane: 'up' | 'down'
  counts: { providers: number; callable_models: number; active_keys: number }
  window: { start: string; end: string; days: number }
  totals: GatewayOverviewTotals
  previous_requests: number
  errors_by_code: Array<{
    status_code: number
    code: string | null
    count: number
  }>
  bucket: 'hour' | 'day'
  series: GatewayOverviewBucket[]
  top_models: Array<{
    model_id: string
    name: string
    provider: string
    requests: number
    total_tokens: number
    spend?: number
  }>
  top_keys: Array<{
    key_id: string
    key_name: string
    requests: number
    total_tokens: number
    spend?: number
  }>
  recent_errors: GatewayLog[]
}

export const modelGatewayAPI = {
  getCatalog(signal?: AbortSignal): Promise<GatewayCatalog> {
    return apiClient.get(path('catalog'), { ...rest, signal })
  },

  updateCatalogModel(
    modelId: string,
    input: GatewayCatalogModelUpdate,
  ): Promise<GatewayCatalogModel> {
    return apiClient.patch(path('catalog/models', modelId), input, rest)
  },

  /** Opens or closes every model of one connection; returns the catalog. */
  updateCatalogInstance(
    instanceId: string,
    input: { enabled: boolean },
  ): Promise<GatewayCatalog> {
    return apiClient.patch(path('catalog/instances', instanceId), input, rest)
  },

  /** The default for models registered later; returns the catalog. */
  updateSettings(input: {
    new_models_enabled: boolean
  }): Promise<GatewayCatalog> {
    return apiClient.patch(path('settings'), input, rest)
  },

  getOverview(
    days: GatewayWindow,
    signal?: AbortSignal,
  ): Promise<GatewayOverview> {
    return apiClient.get(path('overview'), {
      ...rest,
      params: { days },
      signal,
    })
  },

  listKeys(signal?: AbortSignal): Promise<GatewayKey[]> {
    return apiClient.get(path('keys'), { ...rest, signal })
  },

  createKey(input: GatewayKeyCreateInput): Promise<GatewayKeyCreated> {
    return apiClient.post(path('keys'), input, rest)
  },

  updateKey(id: string, input: GatewayKeyUpdateInput): Promise<GatewayKey> {
    return apiClient.patch(path('keys', id), input, rest)
  },

  /** A new secret for the same key; the old one works for the grace period. */
  rotateKey(
    id: string,
    gracePeriodSeconds: number,
  ): Promise<GatewayKeyCreated> {
    return apiClient.post(
      `${path('keys', id)}/rotate`,
      { grace_period_seconds: gracePeriodSeconds },
      rest,
    )
  },

  revokeKey(id: string): Promise<GatewayKey> {
    return apiClient.post(`${path('keys', id)}/revoke`, undefined, rest)
  },

  queryLogs(
    query: GatewayLogQuery,
    signal?: AbortSignal,
  ): Promise<GatewayLogPage> {
    return apiClient.get(path('logs'), { ...rest, params: query, signal })
  },

  usage(query: GatewayUsageQuery, signal?: AbortSignal): Promise<GatewayUsage> {
    return apiClient.get(path('usage'), { ...rest, params: query, signal })
  },
}
