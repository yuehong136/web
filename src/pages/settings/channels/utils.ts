import type { ChannelBinding } from '@/api/channel'

export const isChannelEnabled = (status: string | number | boolean): boolean =>
  status === true ||
  status === 1 ||
  ['1', 'active', 'enabled', 'running'].includes(
    String(status).trim().toLowerCase(),
  )

export const isRuntimeHealthy = (state: string | undefined): boolean =>
  ['connected', 'healthy', 'online', 'running'].includes(
    state?.trim().toLowerCase() ?? '',
  )

/**
 * A stale binding keeps a healthy runner but fails every message, so the card
 * must warn even while the runtime state reads `connected`. Only the server can
 * decide this, so an absent flag never invents a warning.
 */
export const isBindingRevisionStale = (
  binding: ChannelBinding | null | undefined,
): boolean => binding?.revision_stale === true
