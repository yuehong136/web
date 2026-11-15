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

const path = (segment: string, id?: string) =>
  id ? `${base}/${segment}/${encodeURIComponent(id)}` : `${base}/${segment}`

/** Model types the gateway can serve today. */
export const GATEWAY_MODEL_TYPES = ['chat', 'embedding'] as const
export type GatewayModelType = (typeof GATEWAY_MODEL_TYPES)[number]
export type GatewayModelStatus = 'active' | 'inactive'
export type GatewayKeyStatus = 'active' | 'disabled' | 'revoked'
export type GatewayQuotaPeriod = 'day' | 'month'
export type GatewayUsageGroup = 'key' | 'model' | 'day' | 'end_user'
export type GatewayLogOutcome = 'success' | 'error'

/** `null` means unlimited. */
export interface GatewayRateLimits {
  rpm_limit: number | null
  tpm_limit: number | null
  max_parallel_requests: number | null
}

export interface GatewayModelTarget {
  model_name: string
  provider: string
  instance: string
  model_types: string[]
  available: boolean
  relayable: boolean
}

/** A registered model and the types it can be published as (possibly none). */
export interface GatewayCandidate extends GatewayModelTarget {
  model_id: number
  publishable_types: GatewayModelType[]
}

export interface GatewayModel extends GatewayRateLimits {
  id: string
  name: string
  model_id: number
  model_type: GatewayModelType | (string & {})
  status: GatewayModelStatus
  description: string | null
  /** `null` once the registered model no longer exists. */
  target: GatewayModelTarget | null
  create_time: number | null
  update_time: number | null
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
  allow_all_models: boolean
  allowed_model_ids: string[]
  token_quota: number | null
  quota_period: GatewayQuotaPeriod | null
  /** Tokens used in the current period; `null` for keys without a quota. */
  quota_used: number | null
  last_used_at: string | null
  create_time: number | null
  update_time: number | null
}

/** The creation response is the only place the plaintext key ever appears. */
export interface GatewayKeyCreated extends GatewayKey {
  key: string
}

export interface GatewayModelCreateInput extends Partial<GatewayRateLimits> {
  name: string
  model_id: number
  model_type: GatewayModelType
  description?: string | null
}

export interface GatewayModelUpdateInput extends Partial<GatewayRateLimits> {
  name?: string
  description?: string | null
  status?: GatewayModelStatus
}

/** The quota and its period are always sent together (both set or both null). */
export interface GatewayKeyLimitsInput extends Partial<GatewayRateLimits> {
  token_quota?: number | null
  quota_period?: GatewayQuotaPeriod | null
}

export interface GatewayKeyCreateInput extends GatewayKeyLimitsInput {
  name: string
  description?: string | null
  expires_at?: string | null
  allow_all_models?: boolean
  allowed_model_ids?: string[]
}

export interface GatewayKeyUpdateInput extends GatewayKeyLimitsInput {
  name?: string
  description?: string | null
  expires_at?: string | null
  allow_all_models?: boolean
  allowed_model_ids?: string[]
  status?: 'active' | 'disabled'
}

export interface GatewayLog {
  id: string
  key_id: string
  key_name: string
  model: string | null
  gateway_model_id: string | null
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

export const modelGatewayAPI = {
  listCandidates(signal?: AbortSignal): Promise<GatewayCandidate[]> {
    return apiClient.get(path('candidates'), { ...rest, signal })
  },

  listModels(signal?: AbortSignal): Promise<GatewayModel[]> {
    return apiClient.get(path('models'), { ...rest, signal })
  },

  createModel(input: GatewayModelCreateInput): Promise<GatewayModel> {
    return apiClient.post(path('models'), input, rest)
  },

  updateModel(
    id: string,
    input: GatewayModelUpdateInput,
  ): Promise<GatewayModel> {
    return apiClient.patch(path('models', id), input, rest)
  },

  deleteModel(id: string): Promise<null> {
    return apiClient.delete(path('models', id), rest)
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
