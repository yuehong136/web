import type { TFunction } from 'i18next'
import { APIError } from '@/api/client'
import type { GatewayRateLimits } from '@/api/model-gateway'
import { formatDate } from '@/lib/utils'
import { getCurrentLanguage } from '@/locales/i18n'

export const formatCount = (value: number): string =>
  new Intl.NumberFormat(getCurrentLanguage()).format(value)

export const formatInstant = (value: string | null): string | null =>
  value ? formatDate(value) : null

/** Durations are shown in the unit a reader would use for that magnitude. */
export const formatDuration = (milliseconds: number): string =>
  milliseconds < 1000
    ? `${formatCount(milliseconds)} ms`
    : `${new Intl.NumberFormat(getCurrentLanguage(), { maximumFractionDigits: 1 }).format(milliseconds / 1000)} s`

export type GatewayAction = 'publish' | 'model' | 'key'

/**
 * A fixed message key for a failed management request. The server's own
 * error text is never rendered; the status alone picks the message.
 */
export function gatewayErrorKey(error: unknown, action: GatewayAction): string {
  const status = error instanceof APIError ? error.status : 0
  const prefix = 'settings.modelGateway.errors'
  if (status === 409) return `${prefix}.nameTaken`
  if (status === 404) return `${prefix}.gone`
  if (status === 422) return `${prefix}.invalid`
  if (status === 400) {
    if (action === 'publish') return `${prefix}.cannotPublish`
    return action === 'model'
      ? `${prefix}.cannotEnable`
      : `${prefix}.invalidScope`
  }
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
      t('settings.modelGateway.limits.rpmValue', {
        value: formatCount(limits.rpm_limit),
      }),
    )
  if (limits.tpm_limit !== null)
    parts.push(
      t('settings.modelGateway.limits.tpmValue', {
        value: formatCount(limits.tpm_limit),
      }),
    )
  if (limits.max_parallel_requests !== null)
    parts.push(
      t('settings.modelGateway.limits.parallelValue', {
        value: formatCount(limits.max_parallel_requests),
      }),
    )
  return parts.length > 0 ? parts.join(' · ') : null
}
