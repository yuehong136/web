import type { ChannelBinding, ChatChannel } from '@/api/channel'

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

export type ChannelHealth = 'connected' | 'pending' | 'faulted' | 'off'

/**
 * One status per channel, instead of two that had to be read together.
 *
 * The card used to show an "enabled / draft" badge *and* a separate runtime
 * row, so the only question an operator actually has — is this working? — had
 * no single answer, and the two disagreed in the normal case: a channel
 * enabled thirty seconds ago read "enabled" and "waiting" at once.
 *
 * Collapsing them is safe because the states are not independent. A disabled
 * channel has no runner by definition, so its last runtime row is stale noise
 * — which is why `off` wins over a leftover `error`.
 *
 * Lives here rather than beside its Tailwind classes because filtering needs
 * it, and a component importing this file while this file imported the
 * component would be a cycle.
 */
export const channelHealth = (channel: ChatChannel): ChannelHealth => {
  if (!isChannelEnabled(channel.status)) return 'off'
  const state = channel.runtime?.state
  if (isRuntimeHealthy(state)) return 'connected'
  // `error` is also synthesised by the control plane for a binding whose
  // Canvas release went stale, even while the runner itself is healthy.
  if (state === 'error') return 'faulted'
  return 'pending'
}

const normalize = (value: string): string => value.trim().toLowerCase()

/**
 * Whether a channel matches a free-text query.
 *
 * Matches the fields an operator actually remembers a channel by: what they
 * named it, which platform it is on, and what it is bound to. The bound target
 * id is included because it is the one value that gets pasted from elsewhere
 * when someone is chasing "which channel points at this agent?".
 */
export const channelMatchesQuery = (
  channel: ChatChannel,
  query: string,
  providerLabel = '',
): boolean => {
  const needle = normalize(query)
  if (!needle) return true
  return [
    channel.name,
    channel.channel,
    providerLabel,
    channel.binding?.target_id ?? '',
  ].some((field) => normalize(field).includes(needle))
}

export interface ChannelFilter {
  query: string
  onlyFaulted: boolean
  /** Localised provider names, so a search for "飞书" finds them. */
  providerLabels?: Record<string, string>
}

export const filterChannels = (
  channels: readonly ChatChannel[],
  { query, onlyFaulted, providerLabels = {} }: ChannelFilter,
): ChatChannel[] =>
  channels.filter(
    (channel) =>
      channelMatchesQuery(channel, query, providerLabels[channel.channel]) &&
      (!onlyFaulted || channelHealth(channel) === 'faulted'),
  )

export const countFaulted = (channels: readonly ChatChannel[]): number =>
  channels.filter((channel) => channelHealth(channel) === 'faulted').length
