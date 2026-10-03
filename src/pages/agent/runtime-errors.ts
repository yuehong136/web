import { APIError } from '@/api/client-types'

const DELEGATION_MESSAGES: Record<string, string> = {
  context_required: 'contextRequired',
  grant_not_found: 'grantRequired',
  scope_denied: 'toolDenied',
  development_tool_denied: 'toolDenied',
  development_interaction_denied: 'toolDenied',
  assurance_denied: 'assuranceRequired',
  snapshot_invalid: 'serviceUnavailable',
  token_issuance_failed: 'serviceUnavailable',
  server_not_bound: 'configurationRequired',
  server_tenant_mismatch: 'configurationRequired',
  server_audience_mismatch: 'configurationRequired',
  transport_not_supported: 'configurationRequired',
  static_auth_conflict: 'configurationRequired',
  tool_policy_not_found: 'configurationRequired',
}

/** UI renders allowlisted translations, never provider details or error.message. */
export function agentRunErrorKey(
  error: unknown,
  fallback = 'agent.runtime.runFailed',
) {
  if (!(error instanceof APIError)) return fallback
  const message = Object.hasOwn(DELEGATION_MESSAGES, error.code)
    ? DELEGATION_MESSAGES[error.code]
    : undefined
  if (message) return `agent.runtime.authorization.${message}`
  if (error.status === 401) return 'agent.runtime.authorization.signInRequired'
  if (error.status === 403) return 'agent.runtime.authorization.accessDenied'
  if (error.status === 404 || error.status === 409)
    return 'agent.runtime.authorization.targetUnavailable'
  if (error.status === 503)
    return 'agent.runtime.authorization.serviceUnavailable'
  return fallback
}
