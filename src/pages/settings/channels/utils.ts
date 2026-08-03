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
