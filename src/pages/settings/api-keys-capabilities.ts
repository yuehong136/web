interface AvailableCapability {
  enabled: true
}

interface UnavailableCapability {
  enabled: false
  /** i18n key (settings namespace) explaining what is missing to the user. */
  reasonKey: string
}

export type ApiKeyCapability = AvailableCapability | UnavailableCapability

const available: AvailableCapability = { enabled: true }
const unavailable = (reasonKey: string): UnavailableCapability => ({
  enabled: false,
  reasonKey,
})

/**
 * What the API key endpoints (`/system/tokens`: list, create, delete) really
 * support. The API keys page renders a control only for an available
 * capability and explains the unavailable ones; the API docs page offers no
 * request runner. Open an entry only after its API contract and behaviour
 * tests exist, never with simulated responses.
 */
export const apiKeysCapabilities = {
  /** POST /system/tokens; the response carries the new secret once. */
  create: available,
  /** The list returns each token, so it can be copied again later. */
  copy: available,
  /** No rotate endpoint: create the replacement, then delete the old token. */
  regenerate: available,
  /** DELETE /system/tokens/{token}. */
  revoke: available,
  /** No update endpoint: names and descriptions are fixed at creation. */
  edit: unavailable('settings.apiKeys.capabilities.editUnavailable'),
  /** Tokens carry no scope: each key can call every workspace API. */
  scopes: unavailable('settings.apiKeys.capabilities.scopesUnavailable'),
  /** The API docs describe requests; they cannot send them. */
  liveRequest: unavailable(
    'settings.apiKeys.capabilities.liveRequestUnavailable',
  ),
} as const satisfies Record<string, ApiKeyCapability>

export type ApiKeyCapabilityName = keyof typeof apiKeysCapabilities
