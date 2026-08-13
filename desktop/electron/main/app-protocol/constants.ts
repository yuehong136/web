import { normalizeDesktopConnectSources } from '../security/network-policy'

export const APP_SCHEME = 'app'
export const APP_HOST = 'bundle'
export const APP_ENTRY_URL = `${APP_SCHEME}://${APP_HOST}/`

export const APP_SCHEME_PRIVILEGES = Object.freeze({
  standard: true,
  secure: true,
  bypassCSP: false,
  allowServiceWorkers: false,
  supportFetchAPI: true,
  corsEnabled: true,
  stream: false,
  codeCache: true,
  allowExtensions: false,
})

export function createAppContentSecurityPolicy(
  connectSources: readonly string[],
): string {
  const normalizedConnectSources =
    normalizeDesktopConnectSources(connectSources)
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self'${normalizedConnectSources.length ? ` ${normalizedConnectSources.join(' ')}` : ''}`,
    "worker-src 'self' blob:",
    "frame-src 'self' blob: data:",
    "media-src 'self' blob: data: https:",
    "form-action 'self'",
    "manifest-src 'self'",
  ].join('; ')
}
