import { apiClient } from '@/api/client'
import { API_BASE_URL } from '@/constants'

const sdkBase = { baseURL: `${API_BASE_URL}/api` }

/**
 * The channel contract this build was written against.
 *
 * Documented in `MultiRAG:docs/channel-program/CONTRACT.md`, which bumps only
 * on a breaking change — deleting a field, changing what one means, or making
 * an optional one required. Additive change is logged there and leaves this
 * alone, because bumping on every addition would make the assertion below fire
 * weekly and teach everyone to edit the constant until it goes green.
 *
 * The assertion is the entire tooling budget for keeping the two repos honest:
 * everything else is convention plus the two `git log` reconciliation commands
 * in `PROGRESS.md`.
 */
export const CHANNEL_API_VERSION = 'channel-api/v1'

/**
 * The highest `form.version` this build knows how to render.
 *
 * The server bumps that number only when an older client would render a form
 * *wrongly* — changed path semantics, or a field it must honour and cannot
 * know about. Adding fields, kinds or options does not bump it, since unknown
 * kinds already render disabled and unknown keys are ignored.
 *
 * So a higher version is not a hint, it is a refusal: `listProviders` drops
 * the manifest into the same "providers unavailable" path as a missing form.
 * Rendering it anyway is the one outcome the version exists to prevent.
 */
export const SUPPORTED_FORM_VERSION = 1

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

/**
 * One rendered input, already flattened by the server out of the nested config.
 *
 * `kind` is an open union on purpose: a value this client does not recognise
 * must render as a disabled field showing its label, never throw. That is what
 * lets the server introduce a control type without a coordinated release.
 */
export type ChannelFieldKind =
  | 'text'
  | 'password'
  | 'string_list'
  | 'select'
  | 'switch'
  | (string & {})

export interface ChannelFieldOption {
  value: string
  label: string
}

export interface ChannelFormField {
  path: string
  kind: ChannelFieldKind
  label: string
  i18n_key?: string | null
  required?: boolean
  secret?: boolean
  placeholder?: string | null
  help_text?: string | null
  default?: string | boolean | string[] | null
  options?: ChannelFieldOption[] | null
  max_length?: number | null
  max_items?: number | null
}

export interface ChannelProviderForm {
  version: number
  fields: ChannelFormField[]
}

export interface ChannelProviderManifest {
  provider: ChannelProvider
  display_name: string
  /**
   * Server-owned copy for a provider nobody has connected yet, with an
   * optional key so a local translation can win. Both optional on the wire: a
   * backend older than CHN-P13 sends neither, and a card with no subtitle is a
   * better outcome than one that cannot render.
   */
  description?: string
  description_i18n_key?: string | null
  capabilities: Record<string, boolean>
  /**
   * The render contract (CHN-P2). Optional on the wire — and only there: a
   * backend older than CHN-P2 does not send it. `listProviders` drops those
   * rows, so everything downstream of it sees `RenderableProviderManifest`,
   * where the field is required.
   */
  form?: ChannelProviderForm
  /**
   * Validation / OpenAPI contract. Never used for rendering — notably its
   * `required` array is always empty, because every provider field carries a
   * default so PATCH can mean merge.
   */
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

/**
 * A manifest this client can actually draw a form from.
 *
 * The distinction is the whole of the CHN-P7 half-state guard, expressed in
 * the type system rather than in a comment: the wire type keeps `form`
 * optional because an old backend really does omit it, and `listProviders` is
 * the one place that narrows. No consumer needs `?.` on `form`, and none can
 * reintroduce a client-side fallback without first widening this type back.
 */
export type RenderableProviderManifest = ChannelProviderManifest & {
  form: ChannelProviderForm
}

export interface ChannelProviderList {
  items: RenderableProviderManifest[]
}

export interface ChannelConnectionWriteRequest {
  name: string
  channel?: ChannelProvider
  /**
   * Opaque to this layer. The shape belongs to the provider and is assembled
   * from the server's field paths, so nothing here names a provider's fields.
   */
  config: Record<string, unknown>
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
  /** Already assembled into the provider's nested shape by `assembleConfig`. */
  config: Record<string, unknown>
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

/**
 * Wrap an assembled config in the request envelope.
 *
 * The function body no longer mentions a single provider field. It used to
 * read `app_id` / `app_secret` / `domain` / `allowed_open_ids` by name, which
 * meant a second provider's credentials were silently dropped: the form
 * collected them and this function threw them away, producing a POST whose
 * `credential` was `{}`.
 */
export const buildChannelMutationPayload = (
  input: ChannelFormInput,
  mode: 'create' | 'update',
): ChannelMutationPayload => {
  return {
    connection: {
      name: input.name.trim(),
      ...(mode === 'create' ? { channel: input.provider } : {}),
      config: input.config,
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
  /**
   * Provider manifests, minus any the client cannot render.
   *
   * Two ways a manifest can be unrenderable, both handled the same way. No
   * `form` at all means a backend older than CHN-P2. A `form.version` above
   * `SUPPORTED_FORM_VERSION` means one newer than this build, which by the
   * bump rule has changed something this code would get wrong.
   *
   * Dropping them is what makes the two repos deployable independently: with
   * no providers the page shows "provider metadata unavailable" and disables
   * authoring, while the channel list, enable/disable and delete keep working.
   * Keeping a form-less manifest would render zero fields under an enabled
   * Save button — silent, and the exact half-state this ordering exists to
   * avoid.
   */
  async listProviders(): Promise<ChannelProviderList> {
    const response = await apiClient.get<
      ChannelProviderList | ChannelProviderManifest[]
    >('/chat-channels/providers', sdkBase)
    const items = normalizeList(response).items.filter(
      (manifest): manifest is RenderableProviderManifest =>
        (manifest.form?.fields?.length ?? 0) > 0 &&
        (manifest.form?.version ?? 1) <= SUPPORTED_FORM_VERSION,
    )
    return { items }
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
