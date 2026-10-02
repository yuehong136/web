/** 登录/注册需要保留 Authorization 响应头中的 JWT 与完整信封。 */
const AUTH_ENVELOPE_ENDPOINTS = new Set(['/auth/login', '/users'])

/** 精确匹配方法及路径，避免登录子资源与 users/me 被误判。 */
export function isAuthEnvelopeEndpoint(
  endpoint: string,
  method?: string,
): boolean {
  if ((method ?? 'GET').toUpperCase() !== 'POST') return false

  const rawPath = endpoint.startsWith('http')
    ? new URL(endpoint).pathname
    : (endpoint.split('?')[0] ?? '')

  const path = rawPath
    .replace(/^\/api/, '')
    .replace(/^\/v1/, '')
    .replace(/\/+$/, '')

  return AUTH_ENVELOPE_ENDPOINTS.has(path)
}
