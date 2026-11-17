import type { GatewayQuotaPeriod, GatewayRateLimits } from '@/api/model-gateway'

/** Limit inputs are kept as text so an empty field can mean "unlimited". */
export interface LimitDraft {
  rpm: string
  tpm: string
  parallel: string
}

/** An empty amount means "no quota"; the period is kept for when one is typed. */
export interface QuotaDraft {
  tokens: string
  period: GatewayQuotaPeriod
}

/** Aliases share the data plane's name rule. */
export const ALIAS_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/@-]{0,127}$/
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
    : { tokens: '', period: 'month' }

/** Whether any limit or quota is set (the limits section then starts open). */
export const hasLimits = (limits: LimitDraft, quota: QuotaDraft) =>
  [limits.rpm, limits.tpm, limits.parallel, quota.tokens].some((value) =>
    value.trim(),
  )

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
 * The quota and its period travel together: both `null` for "no quota" (an
 * empty amount), or a positive amount with its period. `null` is returned for
 * an invalid amount.
 */
export function parseQuota(draft: QuotaDraft): QuotaPayload | null {
  const tokens = parsePositiveInteger(draft.tokens, MAX_TOKEN_QUOTA)
  if (tokens === undefined) return null
  if (tokens === null) return { token_quota: null, quota_period: null }
  return { token_quota: tokens, quota_period: draft.period }
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

export const EXPIRY_PRESETS = ['never', '30', '90', '365', 'custom'] as const
export type ExpiryPreset = (typeof EXPIRY_PRESETS)[number]

export interface ExpiryDraft {
  preset: ExpiryPreset
  /** `datetime-local` value, used by the custom preset. */
  custom: string
}

/** A stored expiry opens as a custom date; none opens as "never". */
export const expiryDraftOf = (expiresAt: string | null): ExpiryDraft => {
  const custom = toLocalInputValue(expiresAt)
  return custom ? { preset: 'custom', custom } : { preset: 'never', custom: '' }
}

/** The end of the local day N days from now. */
export function presetExpiry(days: number, now: number = Date.now()): Date {
  const date = new Date(now)
  date.setDate(date.getDate() + days)
  date.setHours(23, 59, 0, 0)
  return date
}

/**
 * The expiry to send: an ISO instant, `null` for never, or `undefined` when
 * the custom value is missing, malformed or not in the future.
 */
export function parseExpiryDraft(
  draft: ExpiryDraft,
  now: number = Date.now(),
): string | null | undefined {
  if (draft.preset === 'never') return null
  if (draft.preset === 'custom')
    return draft.custom.trim() ? parseExpiry(draft.custom, now) : undefined
  return presetExpiry(Number(draft.preset), now).toISOString()
}
