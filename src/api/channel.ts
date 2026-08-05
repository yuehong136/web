import { apiClient } from '@/api/client'
import { API_BASE_URL } from '@/constants'

const sdkBase = { baseURL: `${API_BASE_URL}/api` }

export type ChannelProvider = 'feishu' | (string & {})
export type ChannelTargetType = 'multirag.canvas_agent' | 'multirag.dialog'

/**
 * The six states the server actually reports, mirroring `RuntimeState` in
 * `api/channel_runtime/schemas.py`. `(string & {})` keeps an unknown future
 * value renderable instead of crashing — the union is a hint, not a filter.
 *
 * The client used to carry twelve; six of them (`pending`, `running`,
 * `healthy`, `online`, `disabled`, `failed`) were never emitted by anything.
 */
export const RUNTIME_STATES = [
  'waiting',
  'starting',
  'connected',
  'stopping',
  'stopped',
  'error',
] as const

export type RuntimeState = (typeof RUNTIME_STATES)[number] | (string & {})

/**
 * Error codes the control plane returns in the failure envelope's `data`,
 * which `apiClient` surfaces as `APIError.details`. Kept in sync by hand with
 * `ChannelControlError` subclasses; an unknown code falls back to the generic
 * message rather than rendering a raw identifier at an admin.
 */
export const CHANNEL_ERROR_CODES = [
  'CHANNEL_NOT_ACCESSIBLE',
  'CHANNEL_TARGET_NOT_ACCESSIBLE',
  'INVALID_CHANNEL_CONFIGURATION',
  'CHANNEL_SECRET_STORE_UNAVAILABLE',
  'CHANNEL_OPERATION_FAILED',
] as const

export type ChannelErrorCode = (typeof CHANNEL_ERROR_CODES)[number]

const isChannelErrorCode = (value: unknown): value is ChannelErrorCode =>
  typeof value === 'string' &&
  (CHANNEL_ERROR_CODES as readonly string[]).includes(value)

/**
 * Resolve one i18n key for a failed channel operation.
 *
 * Safe against every backend version: one that does not yet return
 * `error_code` simply falls through to `fallbackKey`, which is exactly the
 * message shown today.
 */
export const channelErrorMessageKey = (
  error: unknown,
  fallbackKey: string,
): string => {
  const details = (error as { details?: unknown } | null)?.details
  const code = (details as { error_code?: unknown } | null)?.error_code
  return isChannelErrorCode(code) ? `channel.errorCodes.${code}` : fallbackKey
}

export interface ChannelJsonSchemaProperty {
  type?: 'string' | 'array' | 'boolean' | 'object'
  title?: string
  description?: string
  default?: unknown
  format?: string
  writeOnly?: boolean
  items?: { type?: string }
  required?: string[]
  properties?: Record<string, ChannelJsonSchemaProperty>
  $ref?: string
  ['x-secret']?: boolean
}

export interface ChannelProviderManifest {
  provider: ChannelProvider
  display_name: string
  description?: string
  capabilities: Record<string, boolean>
  config_schema: {
    type?: 'object'
    required?: string[]
    properties?: Record<string, ChannelJsonSchemaProperty>
    $defs?: Record<string, ChannelJsonSchemaProperty>
  }
}

export interface ChannelBinding {
  target_type: ChannelTargetType
  target_id: string
  target_revision_id: string | null
  policy: Record<string, unknown>
  enabled: boolean
  /**
   * Server-resolved hint present on read responses only (like `runtime`):
   * `true` once the bound Canvas release is no longer the latest published one,
   * `null` for dialog targets or when the server did not resolve it.
   */
  revision_stale?: boolean | null
}

export interface ChannelRuntime {
  binding_id: string | null
  desired_generation: number | null
  observed_generation: number
  state: RuntimeState
  runner_id: string | null
  heartbeat_at: string | null
  connected_at: string | null
  last_error_code: string | null
}

export interface ChatChannel {
  id: string
  name: string
  channel: ChannelProvider
  config: Record<string, unknown>
  status: string | number | boolean
  generation: number
  secret: {
    configured: boolean
    version: number | null
  }
  binding: ChannelBinding | null
  runtime?: ChannelRuntime | null
}

export interface ChatChannelList {
  items: ChatChannel[]
  total: number
}

export interface ChannelProviderList {
  items: ChannelProviderManifest[]
}

export interface ChannelConnectionWriteRequest {
  name: string
  channel?: ChannelProvider
  config: {
    credential: {
      app_id?: string
      app_secret?: string
    }
    domain?: string
    allowed_open_ids?: string[]
  }
}

export interface ChannelCreateWriteRequest extends ChannelConnectionWriteRequest {
  channel: ChannelProvider
  binding: ChannelBindingWriteRequest
  status: 0
}

export interface ChannelUpdateWriteRequest extends ChannelConnectionWriteRequest {
  binding?: ChannelBindingWriteRequest
}

export interface ChannelBindingWriteRequest {
  target_type: ChannelTargetType
  target_id: string
  target_revision_id: string | null
  policy: Record<string, unknown>
  enabled: boolean
}

export interface ChannelFormInput {
  name: string
  provider: ChannelProvider
  config: Record<string, string>
  secrets: Record<string, string>
  listFields: ReadonlySet<string>
  targetType: ChannelTargetType
  targetId: string
  targetRevisionId: string
  privateChatOnly: boolean
  bindingEnabled: boolean
}

export interface ChannelMutationPayload {
  connection: ChannelConnectionWriteRequest
  binding: ChannelBindingWriteRequest
}

const cleanStringList = (value: string): string[] => [
  ...new Set(
    value
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean),
  ),
]

export const buildChannelMutationPayload = (
  input: ChannelFormInput,
  mode: 'create' | 'update',
): ChannelMutationPayload => {
  const appId = input.config.app_id?.trim() ?? ''
  const appSecret = input.secrets.app_secret?.trim() ?? ''
  const domain = input.config.domain?.trim() ?? ''
  const allowedOpenIds = input.listFields.has('allowed_open_ids')
    ? cleanStringList(input.config.allowed_open_ids ?? '')
    : []

  const credential: { app_id?: string; app_secret?: string } = {}
  if (appId) credential.app_id = appId
  if (appSecret) credential.app_secret = appSecret

  return {
    connection: {
      name: input.name.trim(),
      ...(mode === 'create' ? { channel: input.provider } : {}),
      config: {
        credential,
        ...(domain ? { domain } : {}),
        allowed_open_ids: allowedOpenIds,
      },
    },
    binding: {
      target_type: input.targetType,
      target_id: input.targetId.trim(),
      target_revision_id:
        input.targetType === 'multirag.canvas_agent'
          ? input.targetRevisionId.trim()
          : null,
      policy: { private_chat_only: input.privateChatOnly },
      enabled: mode === 'update' && input.bindingEnabled,
    },
  }
}

const normalizeList = <T>(
  value: { items?: T[]; channels?: T[]; providers?: T[]; total?: number } | T[],
): { items: T[]; total: number } => {
  if (Array.isArray(value)) return { items: value, total: value.length }
  const items = value.items ?? value.channels ?? value.providers ?? []
  return { items, total: value.total ?? items.length }
}

export const channelAPI = {
  async listProviders(): Promise<ChannelProviderList> {
    const response = await apiClient.get<
      ChannelProviderList | ChannelProviderManifest[]
    >('/chat-channels/providers', sdkBase)
    return { items: normalizeList(response).items }
  },

  async list(): Promise<ChatChannelList> {
    const response = await apiClient.get<ChatChannelList | ChatChannel[]>(
      '/chat-channels',
      sdkBase,
    )
    return normalizeList(response)
  },

  async get(id: string): Promise<ChatChannel> {
    return apiClient.get(`/chat-channels/${encodeURIComponent(id)}`, sdkBase)
  },

  async create(request: ChannelCreateWriteRequest): Promise<ChatChannel> {
    return apiClient.post('/chat-channels', request, sdkBase)
  },

  async update(
    id: string,
    request: ChannelUpdateWriteRequest,
  ): Promise<ChatChannel> {
    return apiClient.patch(
      `/chat-channels/${encodeURIComponent(id)}`,
      request,
      sdkBase,
    )
  },

  async putBinding(
    id: string,
    request: ChannelBindingWriteRequest,
  ): Promise<ChatChannel> {
    return apiClient.put(
      `/chat-channels/${encodeURIComponent(id)}/binding`,
      request,
      sdkBase,
    )
  },

  async remove(id: string): Promise<boolean> {
    return apiClient.delete(`/chat-channels/${encodeURIComponent(id)}`, sdkBase)
  },

  async enable(id: string): Promise<ChatChannel> {
    return apiClient.post(
      `/chat-channels/${encodeURIComponent(id)}/enable`,
      undefined,
      sdkBase,
    )
  },

  async disable(id: string): Promise<ChatChannel> {
    return apiClient.post(
      `/chat-channels/${encodeURIComponent(id)}/disable`,
      undefined,
      sdkBase,
    )
  },

  async runtime(id: string): Promise<ChannelRuntime> {
    return apiClient.get(
      `/chat-channels/${encodeURIComponent(id)}/runtime`,
      sdkBase,
    )
  },
}
