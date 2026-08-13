import { readFile } from 'node:fs/promises'

const ALLOWED_CONNECT_PROTOCOLS = new Set(['http:', 'https:', 'ws:', 'wss:'])
const LOOPBACK_HOSTS = new Set(['127.0.0.1', '[::1]', 'localhost'])
const MAX_CONNECT_SOURCES = 16
const STAGE_MANIFEST_SCHEMA_VERSION = 2
const NETWORK_POLICY_SCHEMA_VERSION = 1
const CSP_SOURCE_FORBIDDEN_CHARACTERS = new Set([
  ';',
  ' ',
  '\t',
  '\n',
  '\v',
  '\f',
  '\r',
])

export interface DesktopNetworkPolicy {
  readonly connectSources: readonly string[]
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function normalizeConnectSource(value: unknown): string {
  if (typeof value !== 'string' || !value) {
    throw new TypeError('Desktop connect source must be a non-empty string.')
  }

  let url: URL
  try {
    url = new URL(value)
  } catch (error) {
    throw new TypeError('Desktop connect source must be an absolute origin.', {
      cause: error,
    })
  }

  if (
    !ALLOWED_CONNECT_PROTOCOLS.has(url.protocol) ||
    url.username ||
    url.password ||
    url.hostname.includes('*') ||
    [...value].some((character) =>
      CSP_SOURCE_FORBIDDEN_CHARACTERS.has(character),
    ) ||
    url.pathname !== '/' ||
    url.search ||
    url.hash ||
    url.origin !== value
  ) {
    throw new TypeError(
      'Desktop connect source must be an exact HTTP(S)/WS(S) origin.',
    )
  }

  if (
    (url.protocol === 'http:' || url.protocol === 'ws:') &&
    !LOOPBACK_HOSTS.has(url.hostname)
  ) {
    throw new TypeError(
      'Insecure Desktop connect sources are limited to loopback hosts.',
    )
  }

  return value
}

export function normalizeDesktopConnectSources(
  sources: unknown,
): readonly string[] {
  if (!Array.isArray(sources) || sources.length > MAX_CONNECT_SOURCES) {
    throw new TypeError('Desktop build manifest has an invalid network policy.')
  }

  const normalized = sources.map(normalizeConnectSource)
  const canonical = [...new Set(normalized)].sort((left, right) =>
    left.localeCompare(right, 'en'),
  )
  if (JSON.stringify(normalized) !== JSON.stringify(canonical)) {
    throw new TypeError('Desktop connect sources must be unique and sorted.')
  }

  return Object.freeze(canonical)
}

export function parseDesktopNetworkPolicy(
  manifestValue: unknown,
): DesktopNetworkPolicy {
  const manifest = asRecord(manifestValue)
  if (manifest?.schemaVersion !== STAGE_MANIFEST_SCHEMA_VERSION) {
    throw new TypeError('Desktop build manifest has an unsupported version.')
  }
  const security = asRecord(manifest?.security)
  if (security?.schemaVersion !== NETWORK_POLICY_SCHEMA_VERSION) {
    throw new TypeError('Desktop network policy has an unsupported version.')
  }
  const canonical = normalizeDesktopConnectSources(security.connectSources)

  return Object.freeze({ connectSources: Object.freeze(canonical) })
}

export async function loadDesktopNetworkPolicy(
  manifestPath: string,
): Promise<DesktopNetworkPolicy> {
  let manifest: unknown
  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  } catch (error) {
    throw new TypeError('Desktop build manifest cannot be read.', {
      cause: error,
    })
  }
  return parseDesktopNetworkPolicy(manifest)
}
