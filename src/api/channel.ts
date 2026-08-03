import { apiClient } from '@/api/client'
import { API_BASE_URL } from '@/constants'

const sdkBase = { baseURL: `${API_BASE_URL}/api` }

export type ChannelProvider = 'feishu' | (string & {})
export type ChannelTargetType = 'multirag.canvas_agent' | 'multirag.dialog'

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
}

export interface ChannelRuntime {
  binding_id: string | null
  desired_generation: number | null
  observed_generation: number
  state: string
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
      enabled: false,
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
