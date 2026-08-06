import type { ChannelHealth } from '../utils'

/**
 * Presentation for a channel's health. The classification itself lives in
 * `../utils` so that filtering can use it without importing a component.
 */
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
