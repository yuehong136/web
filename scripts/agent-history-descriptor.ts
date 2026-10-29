/** Validate fixture ownership and paths before the real consumer imports product code. */
import { readFileSync } from 'node:fs'
import path from 'node:path'
const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)
function check(condition: unknown, label: string): asserts condition {
  if (!condition) throw new Error(label)
}
const absolute = (value: unknown): value is string =>
  typeof value === 'string' && path.isAbsolute(value)
export interface AgentHistoryDescriptor {
  schemaVersion: 1
  ownedOrigin: string
  ownerTokenFile: string
  peerTokenFile: string
  agentId: string
  sparseSessionId: string
  deleteSessionId: string
  expectedSessionIds: string[]
  webSourceRoot: string
  webSha?: string
  backendSha: string
  backendVersion: string
  readbackFile: string
  evidenceRoot: string
  deletionOwned: {
    authorized: true
    agentId: string
    sessionId: string
    resourceOwner: string
    purpose: string
  }
}
const identifier = (value: unknown): value is string =>
  typeof value === 'string' && /^[A-Za-z0-9_-]{1,160}$/.test(value)

export function readAgentHistoryDescriptor(
  file: string,
): AgentHistoryDescriptor {
  const value: unknown = JSON.parse(readFileSync(file, 'utf8'))
  check(isRecord(value) && value.schemaVersion === 1, 'descriptor-schema')
  for (const key of [
    'ownerTokenFile',
    'peerTokenFile',
    'webSourceRoot',
    'readbackFile',
    'evidenceRoot',
  ])
    check(absolute(value[key]), `descriptor-path-${key}`)
  for (const key of ['agentId', 'sparseSessionId', 'deleteSessionId'])
    check(identifier(value[key]), `descriptor-id-${key}`)
  check(
    value.sparseSessionId !== value.deleteSessionId,
    'distinct-session-fixtures',
  )
  check(typeof value.ownedOrigin === 'string', 'descriptor-origin')
  const origin = new URL(value.ownedOrigin)
  check(
    origin.protocol === 'http:' &&
      ['127.0.0.1', 'localhost', '[::1]'].includes(origin.hostname) &&
      origin.origin === value.ownedOrigin &&
      !!origin.port &&
      !origin.username &&
      !origin.password,
    'owned-local-origin-with-explicit-port',
  )
  check(
    Array.isArray(value.expectedSessionIds) &&
      value.expectedSessionIds.every(identifier) &&
      value.expectedSessionIds.length >= 2 &&
      value.expectedSessionIds.length <= 100 &&
      new Set(value.expectedSessionIds).size ===
        value.expectedSessionIds.length &&
      value.expectedSessionIds.includes(String(value.sparseSessionId)) &&
      value.expectedSessionIds.includes(String(value.deleteSessionId)),
    'exact-expected-session-set',
  )
  check(
    typeof value.backendSha === 'string' &&
      /^[0-9a-f]{40}$/.test(value.backendSha),
    'backend-sha',
  )
  check(
    typeof value.backendVersion === 'string' && value.backendVersion.length > 0,
    'backend-version',
  )
  const owned = value.deletionOwned
  check(
    isRecord(owned) &&
      owned.authorized === true &&
      owned.agentId === value.agentId &&
      owned.sessionId === value.deleteSessionId &&
      typeof owned.resourceOwner === 'string' &&
      owned.resourceOwner.length > 0 &&
      typeof owned.purpose === 'string' &&
      owned.purpose.length > 0,
    'exact-owned-deletion-authorization',
  )
  check(
    value.webSha === undefined ||
      (typeof value.webSha === 'string' && /^[0-9a-f]{40}$/.test(value.webSha)),
    'web-sha',
  )
  const text = (key: string) => String(value[key])
  return {
    schemaVersion: 1,
    ownedOrigin: value.ownedOrigin,
    ownerTokenFile: text('ownerTokenFile'),
    peerTokenFile: text('peerTokenFile'),
    webSourceRoot: text('webSourceRoot'),
    readbackFile: text('readbackFile'),
    evidenceRoot: text('evidenceRoot'),
    agentId: text('agentId'),
    sparseSessionId: text('sparseSessionId'),
    deleteSessionId: text('deleteSessionId'),
    expectedSessionIds: value.expectedSessionIds.map(String),
    webSha: value.webSha,
    backendSha: value.backendSha,
    backendVersion: value.backendVersion,
    deletionOwned: {
      authorized: true,
      agentId: String(owned.agentId),
      sessionId: String(owned.sessionId),
      resourceOwner: String(owned.resourceOwner),
      purpose: String(owned.purpose),
    },
  }
}
