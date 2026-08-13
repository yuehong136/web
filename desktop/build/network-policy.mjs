import { loadEnv } from 'vite'
import fs from 'node:fs/promises'

const NETWORK_POLICY_SCHEMA_VERSION = 1
const RENDERER_NETWORK_RECEIPT_SCHEMA_VERSION = 1
const DEFAULT_VITE_MODE = 'production'
const DEFAULT_API_BASE_URL = 'http://localhost:8000'

const LOOPBACK_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]'])
const HTTP_PROTOCOLS = new Set(['http:', 'https:'])
const WEBSOCKET_PROTOCOLS = new Set(['ws:', 'wss:'])
const CSP_SOURCE_FORBIDDEN_CHARACTERS = new Set([
  ';',
  ' ',
  '\t',
  '\n',
  '\v',
  '\f',
  '\r',
])

const NETWORK_ENVIRONMENT_KEYS = Object.freeze({
  api: 'VITE_API_BASE_URL',
  adminApi: 'VITE_ADMIN_API_BASE_URL',
  webSocket: 'VITE_WS_BASE_URL',
})

function assertBuildMode(mode) {
  if (typeof mode !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(mode)) {
    throw new Error('desktop network policy requires a valid Vite build mode')
  }
}

function readEnvironmentValue(environment, key) {
  const value = environment[key]
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string' || value !== value.trim()) {
    throw new Error(`${key} must be a trimmed string`)
  }
  return value
}

function readRawHostname(value) {
  const schemeSeparator = value.indexOf('://')
  if (schemeSeparator < 1) return null

  const authority = value.slice(schemeSeparator + 3).split(/[/?#]/u, 1)[0]

  if (!authority || authority.includes('@')) return null
  if (authority.startsWith('[')) {
    const closingBracket = authority.indexOf(']')
    return closingBracket < 0
      ? null
      : authority.slice(0, closingBracket + 1).toLowerCase()
  }

  return authority.split(':', 1)[0].toLowerCase()
}

function assertSafeOrigin(value, { environmentKey, protocols }) {
  let url
  try {
    url = new URL(value)
  } catch {
    throw new Error(`${environmentKey} must be an absolute URL`)
  }

  if (!protocols.has(url.protocol)) {
    throw new Error(
      `${environmentKey} uses an unsupported protocol: ${url.protocol}`,
    )
  }
  if (url.username || url.password) {
    throw new Error(`${environmentKey} must not contain credentials`)
  }
  if (url.search || url.hash) {
    throw new Error(`${environmentKey} must not contain a query or fragment`)
  }
  if (!url.hostname || url.hostname.includes('*')) {
    throw new Error(`${environmentKey} must contain one exact hostname`)
  }
  if (
    [...value].some((character) =>
      CSP_SOURCE_FORBIDDEN_CHARACTERS.has(character),
    )
  ) {
    throw new Error(`${environmentKey} contains a forbidden CSP character`)
  }

  const isInsecure = url.protocol === 'http:' || url.protocol === 'ws:'
  if (isInsecure) {
    const rawHostname = readRawHostname(value)
    if (
      !rawHostname ||
      !LOOPBACK_HOSTNAMES.has(rawHostname) ||
      !LOOPBACK_HOSTNAMES.has(url.hostname.toLowerCase())
    ) {
      throw new Error(
        `${environmentKey} may use ${url.protocol} only with an exact loopback hostname`,
      )
    }
  }

  return url.origin
}

function resolveHttpOrigin(value, environmentKey) {
  return assertSafeOrigin(value, {
    environmentKey,
    protocols: HTTP_PROTOCOLS,
  })
}

function resolveWebSocketOrigin(value, environmentKey) {
  return assertSafeOrigin(value, {
    environmentKey,
    protocols: WEBSOCKET_PROTOCOLS,
  })
}

function deriveAdminBaseUrl(apiBaseUrl) {
  const adminUrl = new URL(apiBaseUrl)
  adminUrl.port = '8130'
  return adminUrl.toString()
}

function sortedUnique(values) {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right, 'en'),
  )
}

function assertExactKeys(value, expectedKeys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`)
  }

  const actualKeys = Object.keys(value).sort()
  const sortedExpectedKeys = [...expectedKeys].sort()
  if (JSON.stringify(actualKeys) !== JSON.stringify(sortedExpectedKeys)) {
    throw new Error(`${label} contains an unexpected property set`)
  }
}

function assertNullableOrigin(value, label, protocols) {
  if (value === null) return null
  if (typeof value !== 'string') {
    throw new Error(`${label} must be a string or null`)
  }

  const origin = assertSafeOrigin(value, {
    environmentKey: label,
    protocols,
  })
  if (value !== origin) {
    throw new Error(`${label} must be a canonical origin`)
  }
  return origin
}

export function assertDesktopNetworkPolicy(policy) {
  assertExactKeys(
    policy,
    ['schemaVersion', 'viteMode', 'endpoints', 'connectSources'],
    'desktop network policy',
  )
  if (policy.schemaVersion !== NETWORK_POLICY_SCHEMA_VERSION) {
    throw new Error('desktop network policy has an unsupported schema version')
  }
  assertBuildMode(policy.viteMode)
  assertExactKeys(
    policy.endpoints,
    ['apiOrigin', 'adminApiOrigin', 'webSocketOrigin'],
    'desktop network policy endpoints',
  )

  const endpointOrigins = [
    assertNullableOrigin(
      policy.endpoints.apiOrigin,
      'desktop network policy API origin',
      HTTP_PROTOCOLS,
    ),
    assertNullableOrigin(
      policy.endpoints.adminApiOrigin,
      'desktop network policy admin API origin',
      HTTP_PROTOCOLS,
    ),
    assertNullableOrigin(
      policy.endpoints.webSocketOrigin,
      'desktop network policy WebSocket origin',
      WEBSOCKET_PROTOCOLS,
    ),
  ].filter(Boolean)

  if (!Array.isArray(policy.connectSources)) {
    throw new Error('desktop network policy connectSources must be an array')
  }
  if (
    policy.connectSources.some((source) => typeof source !== 'string') ||
    JSON.stringify(policy.connectSources) !==
      JSON.stringify(sortedUnique(endpointOrigins))
  ) {
    throw new Error(
      'desktop network policy connectSources must exactly match its endpoint origins',
    )
  }

  return policy
}

export function createDesktopNetworkPolicy(
  environment,
  { viteMode = DEFAULT_VITE_MODE } = {},
) {
  if (!environment || typeof environment !== 'object') {
    throw new Error('desktop network policy environment must be an object')
  }
  assertBuildMode(viteMode)

  const apiBaseUrl =
    readEnvironmentValue(environment, NETWORK_ENVIRONMENT_KEYS.api) ??
    DEFAULT_API_BASE_URL
  const apiOrigin = resolveHttpOrigin(apiBaseUrl, NETWORK_ENVIRONMENT_KEYS.api)
  const adminBaseUrl =
    readEnvironmentValue(environment, NETWORK_ENVIRONMENT_KEYS.adminApi) ??
    deriveAdminBaseUrl(apiBaseUrl)
  const webSocketBaseUrl = readEnvironmentValue(
    environment,
    NETWORK_ENVIRONMENT_KEYS.webSocket,
  )

  const endpoints = {
    apiOrigin,
    adminApiOrigin: resolveHttpOrigin(
      adminBaseUrl,
      NETWORK_ENVIRONMENT_KEYS.adminApi,
    ),
    webSocketOrigin: webSocketBaseUrl
      ? resolveWebSocketOrigin(
          webSocketBaseUrl,
          NETWORK_ENVIRONMENT_KEYS.webSocket,
        )
      : null,
  }
  const policy = {
    schemaVersion: NETWORK_POLICY_SCHEMA_VERSION,
    viteMode,
    endpoints,
    connectSources: sortedUnique(Object.values(endpoints).filter(Boolean)),
  }

  return assertDesktopNetworkPolicy(policy)
}

export function assertRendererNetworkPolicyReceipt(receipt) {
  assertExactKeys(
    receipt,
    ['schemaVersion', 'viteMode', 'environment'],
    'Renderer network policy receipt',
  )
  if (receipt.schemaVersion !== RENDERER_NETWORK_RECEIPT_SCHEMA_VERSION) {
    throw new Error(
      'Renderer network policy receipt has an unsupported schema version',
    )
  }
  assertBuildMode(receipt.viteMode)
  assertExactKeys(
    receipt.environment,
    Object.values(NETWORK_ENVIRONMENT_KEYS),
    'Renderer network policy receipt environment',
  )
  for (const key of Object.values(NETWORK_ENVIRONMENT_KEYS)) {
    const value = receipt.environment[key]
    if (
      value !== null &&
      (typeof value !== 'string' || !value || value !== value.trim())
    ) {
      throw new Error(
        `Renderer network policy receipt ${key} must be a trimmed string or null`,
      )
    }
  }
  return receipt
}

export function createRendererNetworkPolicyReceipt(
  environment,
  { viteMode = DEFAULT_VITE_MODE } = {},
) {
  if (!environment || typeof environment !== 'object') {
    throw new Error('Renderer network policy receipt requires an environment')
  }
  assertBuildMode(viteMode)

  return assertRendererNetworkPolicyReceipt({
    schemaVersion: RENDERER_NETWORK_RECEIPT_SCHEMA_VERSION,
    viteMode,
    environment: Object.fromEntries(
      Object.values(NETWORK_ENVIRONMENT_KEYS).map((key) => [
        key,
        readEnvironmentValue(environment, key),
      ]),
    ),
  })
}

export async function loadRendererNetworkPolicyReceipt(receiptPath) {
  let receipt
  try {
    receipt = JSON.parse(await fs.readFile(receiptPath, 'utf8'))
  } catch (error) {
    throw new Error('Renderer network policy receipt cannot be read', {
      cause: error,
    })
  }
  return assertRendererNetworkPolicyReceipt(receipt)
}

export function createDesktopNetworkPolicyFromReceipt(receipt) {
  const validatedReceipt = assertRendererNetworkPolicyReceipt(receipt)
  return createDesktopNetworkPolicy(validatedReceipt.environment, {
    viteMode: validatedReceipt.viteMode,
  })
}

export function loadDesktopNetworkPolicy({
  rootDirectory,
  viteMode = DEFAULT_VITE_MODE,
  loadEnvironment = loadEnv,
} = {}) {
  if (typeof rootDirectory !== 'string' || !rootDirectory) {
    throw new Error('desktop network policy requires a repository root')
  }
  assertBuildMode(viteMode)

  // VITE_* values are public Renderer build inputs. Loading only this prefix
  // keeps the desktop policy on the same resolution path as Vite without
  // admitting unrelated process secrets into the manifest-generation path.
  const environment = loadEnvironment(viteMode, rootDirectory, 'VITE_')
  return createDesktopNetworkPolicy(environment, { viteMode })
}

export function resolveDesktopNetworkPolicy({
  rootDirectory,
  mode = DEFAULT_VITE_MODE,
  environmentValues,
  loadEnvironment = loadEnv,
} = {}) {
  if (environmentValues !== undefined) {
    return createDesktopNetworkPolicy(environmentValues, { viteMode: mode })
  }
  return loadDesktopNetworkPolicy({
    rootDirectory,
    viteMode: mode,
    loadEnvironment,
  })
}

export const validateDesktopNetworkPolicy = assertDesktopNetworkPolicy

export {
  DEFAULT_API_BASE_URL,
  DEFAULT_VITE_MODE,
  NETWORK_ENVIRONMENT_KEYS,
  NETWORK_POLICY_SCHEMA_VERSION,
  RENDERER_NETWORK_RECEIPT_SCHEMA_VERSION,
}
