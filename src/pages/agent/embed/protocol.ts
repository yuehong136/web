/**
 * postMessage envelope schema for the Agent canvas iframe embed.
 *
 * The host (third-party page) and the iframe both use this protocol. Every
 * message carries a `v` field for version negotiation. Adding a new message
 * type must keep `v` stable; breaking the wire format requires bumping
 * EMBED_PROTOCOL_VERSION and the host SDK in lockstep.
 */

export const EMBED_PROTOCOL_VERSION = 1

export type EmbedNavigateTarget =
  | 'back'
  | 'explore'
  | 'webhook'
  | 'share'
  | 'versions'
  | 'settings'
  | 'variables'

export type EmbedThemeValue = 'light' | 'dark'

export type EmbedLocaleValue = 'zh-CN' | 'en-US'

export type EmbedOutbound =
  | { v: 1; type: 'ready' }
  | { v: 1; type: 'auth-expired' }
  | { v: 1; type: 'save-success'; agentId: string; title: string }
  | { v: 1; type: 'save-error'; error: string }
  | { v: 1; type: 'run-start'; runId: string }
  | {
      v: 1
      type: 'run-end'
      runId: string
      status: 'success' | 'error' | 'cancelled'
    }
  | { v: 1; type: 'navigate-request'; target: EmbedNavigateTarget }
  | { v: 1; type: 'resize'; height: number }
  | { v: 1; type: 'error'; code: string; message: string }

export type EmbedInbound =
  | {
      v: 1
      type: 'embed-init'
      jwt: string
      locale?: EmbedLocaleValue
      theme?: EmbedThemeValue
    }
  | { v: 1; type: 'auth-refreshed'; jwt: string }
  | { v: 1; type: 'set-theme'; theme: EmbedThemeValue }
  | { v: 1; type: 'set-locale'; locale: EmbedLocaleValue }
  | { v: 1; type: 'trigger-save' }

export type EmbedInboundType = EmbedInbound['type']
export type EmbedOutboundType = EmbedOutbound['type']

const INBOUND_TYPES: ReadonlySet<EmbedInboundType> = new Set([
  'embed-init',
  'auth-refreshed',
  'set-theme',
  'set-locale',
  'trigger-save',
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isThemeValue(value: unknown): value is EmbedThemeValue {
  return value === 'light' || value === 'dark'
}

function isLocaleValue(value: unknown): value is EmbedLocaleValue {
  return value === 'zh-CN' || value === 'en-US'
}

/**
 * Type guard for inbound (host → iframe) messages.
 *
 * Returns true only when the envelope matches EMBED_PROTOCOL_VERSION, has a
 * recognised type, and the type-specific payload fields are well-formed.
 * Unknown types or mismatched payloads return false — callers should drop
 * such messages silently.
 */
export function isEmbedInbound(value: unknown): value is EmbedInbound {
  if (!isRecord(value)) return false
  if (value.v !== EMBED_PROTOCOL_VERSION) return false
  const type = value.type
  if (typeof type !== 'string') return false
  if (!INBOUND_TYPES.has(type as EmbedInboundType)) return false

  switch (type as EmbedInboundType) {
    case 'embed-init':
      if (typeof value.jwt !== 'string' || value.jwt.length === 0) return false
      if (value.locale !== undefined && !isLocaleValue(value.locale))
        return false
      if (value.theme !== undefined && !isThemeValue(value.theme)) return false
      return true
    case 'auth-refreshed':
      return typeof value.jwt === 'string' && value.jwt.length > 0
    case 'set-theme':
      return isThemeValue(value.theme)
    case 'set-locale':
      return isLocaleValue(value.locale)
    case 'trigger-save':
      return true
    default:
      return false
  }
}

/**
 * Distributive Omit so each member of the union retains its own discriminant.
 * `Omit<EmbedOutbound, 'v'>` directly would collapse the union to the shared
 * keys and break the type guard for downstream callers.
 */
export type EmbedOutboundPayload = EmbedOutbound extends infer T
  ? T extends EmbedOutbound
    ? Omit<T, 'v'>
    : never
  : never

/**
 * Convenience helper to build an outbound envelope with the protocol version
 * already filled in. Keeps call-sites tidy and prevents drift from the literal
 * `v: 1` numbering.
 */
export function makeOutbound(payload: EmbedOutboundPayload): EmbedOutbound {
  return { v: EMBED_PROTOCOL_VERSION, ...payload } as EmbedOutbound
}
