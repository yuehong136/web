import type { TFunction } from 'i18next'
import { APIError } from '@/api/client'
import type {
  GatewayCatalogModel,
  GatewayKey,
  GatewayLog,
  GatewayOverview,
  GatewayRateLimits,
} from '@/api/model-gateway'
import { formatDate } from '@/lib/utils'
import { getCurrentLanguage } from '@/locales/i18n'

export const PREFIX = 'settings.modelGateway'

export const formatCount = (value: number): string =>
  new Intl.NumberFormat(getCurrentLanguage()).format(value)

/** 42,800,000 → "42.8M" (or the locale's own compact form). */
export const formatCompact = (value: number): string =>
  new Intl.NumberFormat(getCurrentLanguage(), {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)

export const formatPercent = (ratio: number, digits = 1): string =>
  new Intl.NumberFormat(getCurrentLanguage(), {
    style: 'percent',
    maximumFractionDigits: digits,
  }).format(ratio)

/** "+12%" / "-3%": a change with its sign. */
export const formatChange = (ratio: number): string =>
  new Intl.NumberFormat(getCurrentLanguage(), {
    style: 'percent',
    maximumFractionDigits: 0,
    signDisplay: 'exceptZero',
  }).format(ratio)

export const formatInstant = (value: string | null): string | null =>
  value ? formatDate(value) : null

/** Durations are shown in the unit a reader would use for that magnitude. */
export const formatDuration = (milliseconds: number): string =>
  milliseconds < 1000
    ? `${formatCount(Math.round(milliseconds))} ms`
    : `${new Intl.NumberFormat(getCurrentLanguage(), { maximumFractionDigits: 1 }).format(milliseconds / 1000)} s`

export type GatewayAction = 'model' | 'key' | 'catalog'

/**
 * A fixed message key for a failed management request. The server's own
 * error text is never rendered; the status alone picks the message.
 */
export function gatewayErrorKey(error: unknown, action: GatewayAction): string {
  const status = error instanceof APIError ? error.status : 0
  const prefix = `${PREFIX}.errors`
  if (status === 409)
    return action === 'model' ? `${prefix}.aliasTaken` : `${prefix}.nameTaken`
  if (status === 404) return `${prefix}.gone`
  if (status === 422) return `${prefix}.invalid`
  if (status === 400)
    return action === 'key' ? `${prefix}.invalidScope` : `${prefix}.invalid`
  return `${prefix}.failed`
}

/** One line such as "60 req/min · 100,000 tokens/min", or `null` if unlimited. */
export function limitSummary(
  t: TFunction,
  limits: GatewayRateLimits,
): string | null {
  const parts: string[] = []
  if (limits.rpm_limit !== null)
    parts.push(
      t(`${PREFIX}.limits.rpmValue`, { value: formatCount(limits.rpm_limit) }),
    )
  if (limits.tpm_limit !== null)
    parts.push(
      t(`${PREFIX}.limits.tpmValue`, { value: formatCount(limits.tpm_limit) }),
    )
  if (limits.max_parallel_requests !== null)
    parts.push(
      t(`${PREFIX}.limits.parallelValue`, {
        value: formatCount(limits.max_parallel_requests),
      }),
    )
  return parts.length > 0 ? parts.join(' · ') : null
}

const KNOWN_CAPABILITIES = new Set([
  'chat',
  'embedding',
  'rerank',
  'image2text',
  'speech2text',
  'tts',
  'ocr',
])

/** A capability label; unknown protocol values are shown as they are. */
export const capabilityLabel = (t: TFunction, type: string): string =>
  KNOWN_CAPABILITIES.has(type) ? t(`${PREFIX}.capabilities.${type}`) : type

/** Why a model cannot be called, or `null` when it can. */
export function modelStateLabel(
  t: TFunction,
  model: GatewayCatalogModel,
): string | null {
  if (model.reason) return t(`${PREFIX}.states.${model.reason}`)
  if (model.state === 'closed') return t(`${PREFIX}.states.closed`)
  return null
}

/**
 * The data plane address. Without a public URL and on a wildcard listen
 * address, the page's own host with the listen port is the best guess.
 */
export function resolveBaseUrl(
  overview: Pick<GatewayOverview, 'base_url' | 'listen_port'> | undefined,
  location: Pick<Location, 'protocol' | 'hostname'> = window.location,
): string | null {
  if (!overview) return null
  if (overview.base_url) return overview.base_url
  return `${location.protocol}//${location.hostname}:${overview.listen_port}/v1`
}

/** Endpoint names as logged, with their route and label key. */
const ENDPOINTS: Record<string, { path: string; label: string }> = {
  'chat.completions': { path: 'POST /v1/chat/completions', label: 'chat' },
  embeddings: { path: 'POST /v1/embeddings', label: 'embeddings' },
  messages: { path: 'POST /v1/messages', label: 'messages' },
}

export const endpointPath = (endpoint: string): string =>
  ENDPOINTS[endpoint]?.path ?? endpoint

/** "Chat · Streamed" for a log row. */
export function endpointLabel(t: TFunction, log: GatewayLog): string {
  const known = ENDPOINTS[log.endpoint]
  const name = known ? t(`${PREFIX}.endpoints.${known.label}`) : log.endpoint
  return log.stream ? `${name} · ${t(`${PREFIX}.endpoints.stream`)}` : name
}

export const logFailed = (log: GatewayLog) =>
  log.error_type !== null || log.status_code >= 400

export type StatusTone = 'success' | 'warning' | 'error' | 'neutral'

/** 2xx success, 4xx caused by the caller or a limit, 5xx upstream/gateway. */
export function statusTone(statusCode: number): StatusTone {
  if (statusCode < 400) return 'success'
  if (statusCode < 500) return 'warning'
  return 'error'
}

const KNOWN_ERROR_CODES = new Set([
  'invalid_api_key',
  'api_key_disabled',
  'api_key_expired',
  'invalid_json',
  'missing_model',
  'model_endpoint_mismatch',
  'model_not_allowed',
  'model_not_found',
  'request_too_large',
  'rate_limit_exceeded',
  'concurrency_limit_exceeded',
  'insufficient_quota',
  'upstream_auth_error',
  'upstream_error',
  'upstream_unreachable',
  'model_unavailable',
  'upstream_timeout',
  'client_closed',
  'internal_error',
])

/** The machine-readable reason of a failed call, as recorded. */
export const errorCodeOf = (log: GatewayLog): string | null =>
  log.error_code ?? log.error_type

/** A fixed explanation for a known error code, or `null`. */
export function errorExplanation(t: TFunction, log: GatewayLog): string | null {
  const code = errorCodeOf(log)
  if (code && KNOWN_ERROR_CODES.has(code))
    return t(`${PREFIX}.errorCodes.${code}`)
  // Other upstream 4xx answers are passed through unchanged.
  if (log.status_code >= 400 && log.status_code < 500 && !code)
    return t(`${PREFIX}.errorCodes.upstream_4xx`)
  return null
}

const DAY = 86_400_000

/** Whole days until the expiry: negative once expired, `null` for never. */
export function daysLeft(key: Pick<GatewayKey, 'expires_at'>, now: number) {
  if (!key.expires_at) return null
  const at = new Date(key.expires_at).getTime()
  if (Number.isNaN(at)) return null
  return at <= now ? -1 : Math.floor((at - now) / DAY)
}

/** A quota's used share as a 0–100 percentage, or `null` without a quota. */
export function quotaPercent(
  key: Pick<GatewayKey, 'token_quota' | 'quota_used'>,
): number | null {
  if (!key.token_quota) return null
  return Math.min(100, ((key.quota_used ?? 0) / key.token_quota) * 100)
}
