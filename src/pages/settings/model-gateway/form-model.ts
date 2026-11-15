import type { GatewayQuotaPeriod, GatewayRateLimits } from '@/api/model-gateway'

/** Limit inputs are kept as text so an empty field can mean "unlimited". */
export interface LimitDraft {
  rpm: string
  tpm: string
  parallel: string
}

export interface QuotaDraft {
  tokens: string
  period: 'none' | GatewayQuotaPeriod
}

export const PUBLIC_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/@-]{0,127}$/
const MAX_RATE_LIMIT = 2_000_000_000
const MAX_TOKEN_QUOTA = 9_000_000_000_000_000

const text = (value: number | null | undefined) =>
  value === null || value === undefined ? '' : String(value)

export const emptyLimitDraft = (): LimitDraft => ({
  rpm: '',
  tpm: '',
  parallel: '',
})

export const limitDraftOf = (limits: GatewayRateLimits): LimitDraft => ({
  rpm: text(limits.rpm_limit),
  tpm: text(limits.tpm_limit),
  parallel: text(limits.max_parallel_requests),
})

export const quotaDraftOf = (
  tokens: number | null,
  period: GatewayQuotaPeriod | null,
): QuotaDraft =>
  tokens !== null && period !== null
    ? { tokens: String(tokens), period }
    : { tokens: '', period: 'none' }

/**
 * An empty field is `null` (unlimited), a positive integer is that number,
 * and anything else is `undefined`, which callers treat as invalid.
 */
export function parsePositiveInteger(
  value: string,
  max: number = MAX_RATE_LIMIT,
): number | null | undefined {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (!/^[1-9]\d{0,15}$/.test(trimmed)) return undefined
  const parsed = Number(trimmed)
  return parsed <= max ? parsed : undefined
}

/** The three rate limits, or `null` when any field is invalid. */
export function parseLimits(draft: LimitDraft): GatewayRateLimits | null {
  const rpm = parsePositiveInteger(draft.rpm)
  const tpm = parsePositiveInteger(draft.tpm)
  const parallel = parsePositiveInteger(draft.parallel)
  if (rpm === undefined || tpm === undefined || parallel === undefined)
    return null
  return { rpm_limit: rpm, tpm_limit: tpm, max_parallel_requests: parallel }
}

export interface QuotaPayload {
  token_quota: number | null
  quota_period: GatewayQuotaPeriod | null
}

/**
 * The quota and its period travel together: both `null` for "no quota", or a
 * positive amount with its period. `null` is returned for an invalid amount.
 */
export function parseQuota(draft: QuotaDraft): QuotaPayload | null {
  if (draft.period === 'none') return { token_quota: null, quota_period: null }
  const tokens = parsePositiveInteger(draft.tokens, MAX_TOKEN_QUOTA)
  if (tokens === null || tokens === undefined) return null
  return { token_quota: tokens, quota_period: draft.period }
}

/** A public name suggestion from a registered model name. */
export function suggestPublicName(modelName: string): string {
  const cleaned = modelName
    .split('___')[0]
    .trim()
    .replace(/[^A-Za-z0-9._:/@-]+/g, '-')
    .replace(/^[^A-Za-z0-9]+/, '')
    .slice(0, 128)
  return cleaned
}

/** `datetime-local` value for an ISO instant, in the browser's time zone. */
export function toLocalInputValue(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/**
 * ISO instant for a `datetime-local` value: `null` when empty, `undefined`
 * when it is not a date or not in the future.
 */
export function parseExpiry(
  value: string,
  now: number = Date.now(),
): string | null | undefined {
  if (!value.trim()) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime()) || date.getTime() <= now) return undefined
  return date.toISOString()
}
