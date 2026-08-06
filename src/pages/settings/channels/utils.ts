import type { ChannelBinding } from '@/api/channel'

export const isChannelEnabled = (status: string | number | boolean): boolean =>
  status === true ||
  status === 1 ||
  ['1', 'active', 'enabled', 'running'].includes(
    String(status).trim().toLowerCase(),
  )

/**
 * `connected` is the only healthy state the server can report.
 *
 * This used to list four values; three of them (`healthy`, `online`,
 * `running`) were unreachable — invented client-side and never emitted by
 * anything. The result happened to be correct, by luck rather than design.
 */
export const isRuntimeHealthy = (state: string | undefined): boolean =>
  state?.trim().toLowerCase() === 'connected'

/**
 * A stale binding keeps a healthy runner but fails every message, so the card
 * must warn even while the runtime state reads `connected`. Only the server can
 * decide this, so an absent flag never invents a warning.
 */
export const isBindingRevisionStale = (
  binding: ChannelBinding | null | undefined,
): boolean => binding?.revision_stale === true

const RELATIVE_STEPS: [
  limitSeconds: number,
  perUnit: number,
  unit: Intl.RelativeTimeFormatUnit,
][] = [
  [60, 1, 'second'],
  [3600, 60, 'minute'],
  [86400, 3600, 'hour'],
  [Number.POSITIVE_INFINITY, 86400, 'day'],
]

/**
 * A heartbeat as an age, not as a wall-clock time.
 *
 * The only question a heartbeat answers is whether the runner is still
 * reporting, and an absolute timestamp makes the reader do that subtraction
 * themselves — once per row, which does not scale to a list of ten. The exact
 * time stays available in the element's `title`.
 *
 * `Intl.RelativeTimeFormat` is built in, so this costs no dependency.
 */
export const formatHeartbeatAge = (
  isoTimestamp: string | null | undefined,
  locale: string,
  now: number = Date.now(),
): string => {
  if (!isoTimestamp) return '—'
  const at = new Date(isoTimestamp).getTime()
  if (Number.isNaN(at)) return '—'

  const elapsed = Math.max(0, Math.round((now - at) / 1000))
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  for (const [limit, perUnit, unit] of RELATIVE_STEPS) {
    if (elapsed < limit)
      return format.format(-Math.floor(elapsed / perUnit), unit)
  }
  return '—'
}
