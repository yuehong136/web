import { apiClient } from '@/api/client'

/**
 * In-iframe runtime patch for the singleton apiClient. The iframe has its own
 * JS context, so mutating the singleton here does not affect the main app.
 *
 * Three things are patched, all contained to this file:
 *
 *   1. `authToken` is written in-memory only via `setEmbedJwt`. We bypass
 *      `apiClient.setAuthToken(...)` because that writes to localStorage,
 *      which would pollute the main site's session on same-origin embeds.
 *
 *   2. `clearAuthState` is replaced with a noop that only clears the in-memory
 *      token — the main-site `auth-storage` keys must never be touched from
 *      embed context.
 *
 *   3. `notifyUnauthorized` is replaced with a callback that surfaces the 401
 *      via postMessage to the host. The default behaviour (dispatch
 *      `auth:logout` + ?expired=true) would cascade into `window.location.reload`
 *      and `window.location.href = '/auth/login'` inside the iframe, which
 *      breaks the host hand-off and drops the embed session.
 *
 * The original method implementations are intentionally not stashed for
 * restoration: iframe unmount equals window destruction, no leak path exists.
 */

type ApiClientInternal = {
  authToken: string | null
  clearAuthState: () => void
  notifyUnauthorized: () => void
}

const internal = apiClient as unknown as ApiClientInternal

let patched = false

const BEARER_PREFIX_PATTERN = /^Bearer\s+/i

export interface EmbedAuthRuntime {
  onAuthExpired: () => void
}

export function normalizeEmbedJwt(jwt: string): string {
  let normalized = jwt.trim()

  while (BEARER_PREFIX_PATTERN.test(normalized)) {
    normalized = normalized.replace(BEARER_PREFIX_PATTERN, '').trim()
  }

  return normalized
}

export function installApiClientPatch(runtime: EmbedAuthRuntime): void {
  if (patched) {
    return
  }

  internal.clearAuthState = () => {
    internal.authToken = null
  }

  internal.notifyUnauthorized = () => {
    runtime.onAuthExpired()
  }

  patched = true
}

/**
 * Set the JWT used for outbound requests. Writes the in-memory field directly
 * to avoid `setAuthToken`'s side effect of persisting to localStorage.
 */
export function setEmbedJwt(jwt: string): void {
  internal.authToken = normalizeEmbedJwt(jwt)
}

/**
 * Drop the in-memory JWT. Used when the host signals revocation or when the
 * iframe transitions back to an unauthenticated waiting state after 401.
 */
export function clearEmbedJwt(): void {
  internal.authToken = null
}

/**
 * Visible for tests. Indicates whether `installApiClientPatch` has executed
 * in this JS context.
 */
export function isApiClientPatched(): boolean {
  return patched
}

/**
 * Visible for tests only. Resets the module-level patched flag so subsequent
 * tests can re-install. NOT for production code paths.
 */
export function __resetApiClientPatchForTests(): void {
  patched = false
  internal.authToken = null
}
