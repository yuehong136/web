import type { ChatChannel } from '@/api/channel'
import { isChannelEnabled, isRuntimeHealthy } from '../utils'

export type ChannelHealth = 'connected' | 'pending' | 'faulted' | 'off'

/**
 * One status per channel, instead of two that had to be read together.
 *
 * The card used to show an "enabled / draft" badge *and* a separate runtime
 * row, which meant the only question an operator actually has — is this
 * working? — had no single answer on screen. Worse, the two disagreed in the
 * normal case: a channel enabled thirty seconds ago reads "enabled" and
 * "waiting" at once.
 *
 * Collapsing them is safe because the states are not independent. A disabled
 * channel has no runner by definition, so its runtime value is noise; an
 * enabled one is exactly as healthy as its runner.
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

/** Tailwind classes for the status dot, keyed by health. */
export const HEALTH_DOT: Record<ChannelHealth, string> = {
  connected: 'bg-status-success',
  // Amber, and pulsing: a channel stuck in `waiting` looks identical to one
  // that is starting up, so movement is the only cue that it is transient.
  pending: 'bg-status-warning animate-pulse',
  faulted: 'bg-status-error',
  off: 'bg-text-caption',
}

export const HEALTH_TEXT: Record<ChannelHealth, string> = {
  connected: 'text-status-success',
  pending: 'text-status-warning',
  faulted: 'text-status-error',
  off: 'text-text-secondary',
}
