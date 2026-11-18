import type { ChannelHealth } from '../utils'

/**
 * Presentation for a channel's health. The classification itself lives in
 * `../utils` so that filtering can use it without importing a component.
 */
export const HEALTH_DOT: Record<ChannelHealth, string> = {
  connected: 'bg-success-fg',
  // Amber, and pulsing: a channel stuck in `waiting` looks identical to one
  // that is starting up, so movement is the only cue that it is transient.
  pending: 'bg-warning-fg animate-pulse',
  faulted: 'bg-danger-fg',
  off: 'bg-fg-subtle',
}

export const HEALTH_TEXT: Record<ChannelHealth, string> = {
  connected: 'text-success-fg',
  pending: 'text-warning-fg',
  faulted: 'text-danger-fg',
  off: 'text-fg-muted',
}
