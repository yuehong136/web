/** Actual domain API/HTTP consumer; SQL readback is written independently by I. */
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
  closeSync,
  constants,
  existsSync,
  fstatSync,
  fsyncSync,
  openSync,
  readFileSync,
  realpathSync,
  writeSync,
} from 'node:fs'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { isDeepStrictEqual } from 'node:util'
import { APIError, apiClient } from '@/api/client'
import { createDatasourceConnectorAPI } from '@/api/datasource'
import {
  getDataSourceDefaultValues,
  prepareDataSourceValues,
} from '@/pages/settings/datasource/constants/form-values'
import {
  DataSourceKey,
  type IDataSource,
} from '@/pages/settings/datasource/types'

interface Descriptor {
  schemaVersion: 1
  ownedOrigin: string
  ownerTokenFile: string
  peerTokenFile: string
  evidenceRoot: string
  webSourceRoot: string
  backendSha: string
  backendVersion: string
  connectorName: string
  initialConfig: Record<string, unknown>
  updatedConfig: Record<string, unknown>
  readbackFile: string
}

interface SQLReadback {
  schemaVersion: 1
  connectorId: string
  connectorName: string
  source: 'mssql'
  exists: true
  config: Record<string, unknown>
}

function object(value: unknown): Record<string, unknown> {
  assert.ok(
    value !== null && typeof value === 'object' && !Array.isArray(value),
  )
  return value as Record<string, unknown>
}

function readPrivate(file: string): string {
  assert.ok(
    typeof file === 'string' && path.isAbsolute(file),
    'Private input paths must be absolute',
  )
  const fd = openSync(file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0))
  try {
    const stat = fstatSync(fd)
    assert.ok(
      stat.isFile() && (stat.mode & 0o077) === 0,
      'Use private regular input files',
    )
    return readFileSync(fd, 'utf8')
  } finally {
    closeSync(fd)
  }
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical)
  if (value !== null && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, canonical(child)]),
    )
  return value
}

const hash = (value: unknown) =>
  createHash('sha256')
    .update(JSON.stringify(canonical(value)))
    .digest('hex')
const descriptorFile = process.env.I_WEB_ACCEPTANCE_DESCRIPTOR
const journalFile = process.env.MULTIRAG_RUN_JOURNAL
assert.ok(
  descriptorFile && journalFile,
  'Use the registered I runtime and descriptor',
)
let parsedDescriptor: unknown
try {
  parsedDescriptor = JSON.parse(readPrivate(descriptorFile))
} catch {
  throw new Error('Unable to read the private descriptor')
}
const descriptor = object(parsedDescriptor) as unknown as Descriptor
assert.ok(descriptor.schemaVersion === 1, 'Unsupported descriptor schema')
let url: URL
try {
  url = new URL(descriptor.ownedOrigin)
} catch {
  throw new Error('Invalid owned origin')
}
assert.equal(url.protocol, 'http:')
assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname))
assert.ok(
  url.origin === descriptor.ownedOrigin,
  'Use an owned origin without a path or credentials',
)
assert.equal(
  realpathSync(descriptor.webSourceRoot),
  realpathSync(path.resolve(import.meta.dirname, '..')),
)
assert.ok(
  typeof descriptor.backendSha === 'string' &&
    /^[a-f0-9]{40}$/.test(descriptor.backendSha),
  'Supply the exact backend SHA',
)
assert.ok(
  typeof descriptor.backendVersion === 'string' && descriptor.backendVersion,
)
assert.ok(
  typeof descriptor.connectorName === 'string' &&
    descriptor.connectorName.trim(),
)
const evidenceRoot = realpathSync(descriptor.evidenceRoot)
assert.ok(
  path.resolve(descriptor.readbackFile).startsWith(evidenceRoot + path.sep),
)
assert.equal(
  existsSync(descriptor.readbackFile),
  false,
  'Independent readback must not already exist',
)
object(descriptor.initialConfig)
object(descriptor.updatedConfig)
const ownerToken = readPrivate(descriptor.ownerTokenFile).trim()
const peerToken = readPrivate(descriptor.peerTokenFile).trim()
assert.ok(
  ownerToken && peerToken && ownerToken !== peerToken,
  'Use distinct registered identities',
)
const fd = openSync(
  journalFile,
  constants.O_WRONLY | constants.O_APPEND | (constants.O_NOFOLLOW ?? 0),
)
assert.ok(fstatSync(fd).isFile(), 'Append only to the existing runner journal')
const record = (kind: string, fields: Record<string, unknown> = {}) => {
  const line = Buffer.from(
    JSON.stringify({ kind, utc: new Date().toISOString(), ...fields }) + '\n',
  )
  let written = 0
  while (written < line.length) {
    const count = writeSync(fd, line.subarray(written))
    assert.ok(count > 0, 'Unable to append the resource journal')
    written += count
  }
  fsyncSync(fd)
}

const api = createDatasourceConnectorAPI(descriptor.ownedOrigin)
let connectorId: string | undefined
let deleted = false
let failure: unknown
const originalFetch = globalThis.fetch
const receipts: {
  method: string
  path: string
  status: number
  code: unknown
}[] = []
globalThis.fetch = async (input, init) => {
  const response = await originalFetch(input, init)
  const endpoint = new URL(input instanceof Request ? input.url : String(input))
  if (
    endpoint.origin === url.origin &&
    endpoint.pathname.startsWith('/api/v1/connectors')
  ) {
    const body: unknown = await response
      .clone()
      .json()
      .catch(() => null)
    const envelope =
      body !== null && typeof body === 'object' ? object(body) : {}
    const rawCode = envelope.retcode ?? envelope.code
    const receipt = {
      method: init?.method ?? 'GET',
      path: endpoint.pathname,
      status: response.status,
      code:
        typeof rawCode === 'number' ||
        (typeof rawCode === 'string' && /^\d{1,4}$/.test(rawCode))
          ? rawCode
          : null,
    }
    receipts.push(receipt)
    record('mssql-http-response', receipt)
  }
  return response
}

function check(row: IDataSource, expected: Record<string, unknown>): void {
  assert.ok(
    row.id === connectorId &&
      row.name === descriptor.connectorName &&
      row.source === DataSourceKey.MSSQL,
    'Exact newly created connector identity must match',
  )
  assert.ok(
    isDeepStrictEqual(row.config, expected),
    'MSSQL configuration did not round-trip',
  )
  assert.ok(
    row.config.port === 1433 && row.config.sync_deleted_files === false,
    'Preserve port and explicit deletion-sync false',
  )
}

async function deny(
  identity: 'peer' | 'anonymous',
  operation: string,
  action: () => Promise<unknown>,
): Promise<void> {
  record('before-mssql-denial', {
    connectorId,
    connectorName: descriptor.connectorName,
    identity,
    operation,
  })
  let denied = false
  try {
    await action()
  } catch (error) {
    assert.ok(
      error instanceof APIError,
      'Denial must use the actual API error contract',
    )
    assert.ok(
      identity === 'peer'
        ? error.status === 200 && error.code === '109'
        : error.status === 401 && error.code === '401',
      'Unexpected authorization response',
    )
    denied = true
  }
  assert.ok(denied, 'Foreign or anonymous operation unexpectedly succeeded')
}

async function deleteOwned(): Promise<void> {
  if (!connectorId || deleted) return
  apiClient.setAuthToken(ownerToken)
  const current = await api.get(connectorId)
  assert.ok(
    current.id === connectorId &&
      current.name === descriptor.connectorName &&
      current.source === DataSourceKey.MSSQL,
    'Refuse cleanup without independently confirmed fixture identity',
  )
  record('before-mssql-owned-delete', {
    connectorId,
    connectorName: descriptor.connectorName,
  })
  await api.delete(connectorId)
  assert.ok(
    !(await api.list()).some((row) => row.id === connectorId),
    'Deleted fixture remains in owner inventory',
  )
  deleted = true
  record('mssql-owned-delete-confirmed', {
    connectorId,
    connectorName: descriptor.connectorName,
  })
}

async function readSQL(): Promise<SQLReadback> {
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    if (existsSync(descriptor.readbackFile)) {
      try {
        return object(
          JSON.parse(readPrivate(descriptor.readbackFile)),
        ) as unknown as SQLReadback
      } catch (error) {
        if (!(error instanceof SyntaxError)) throw error
      }
    }
    await delay(100)
  }
  throw new Error('Independent SQL readback did not arrive')
}

try {
  record('reserve-mssql-consumer', {
    connectorName: descriptor.connectorName,
    connectorId: null,
    ownedOrigin: descriptor.ownedOrigin,
    webSourceRoot: descriptor.webSourceRoot,
    backendSha: descriptor.backendSha,
    backendVersion: descriptor.backendVersion,
    readbackFile: descriptor.readbackFile,
  })
  apiClient.setAuthToken(ownerToken)
  assert.ok(
    !(await api.list()).some((row) => row.name === descriptor.connectorName),
    'Fixture name already exists; refuse to adopt it',
  )
  const values = getDataSourceDefaultValues(DataSourceKey.MSSQL, {
    config: descriptor.initialConfig,
  })
  const initial = prepareDataSourceValues(DataSourceKey.MSSQL, values).config!
  assert.ok(
    initial.port === 1433 && initial.sync_deleted_files === false,
    'Fixture must use default TCP port and false deletion sync',
  )
  assert.ok(
    typeof initial.query === 'string' && initial.query.trim(),
    'Supply a nonempty SELECT fixture; this is not server SQL validation',
  )
  record('before-mssql-owned-create', {
    connectorName: descriptor.connectorName,
    source: 'mssql',
    configSha256: hash(initial),
  })
  const created = await api.set({
    name: descriptor.connectorName,
    source: DataSourceKey.MSSQL,
    config: initial,
    refresh_freq: 0,
    prune_freq: 0,
  })
  assert.ok(typeof created.id === 'string' && created.id)
  connectorId = created.id
  record('mssql-owned-created', {
    connectorId,
    connectorName: descriptor.connectorName,
  })
  check(await api.get(connectorId), initial)
  const edited = getDataSourceDefaultValues(DataSourceKey.MSSQL, {
    config: initial,
  })
  edited.config = {
    ...edited.config,
    ...descriptor.updatedConfig,
    credentials: {
      ...object(initial.credentials),
      ...object(descriptor.updatedConfig.credentials ?? {}),
    },
  }
  const finalConfig = prepareDataSourceValues(
    DataSourceKey.MSSQL,
    edited,
    initial,
  ).config!
  assert.ok(
    typeof finalConfig.query === 'string' &&
      finalConfig.query.trim() &&
      finalConfig.port === 1433 &&
      finalConfig.sync_deleted_files === false,
    'Updated fixture must preserve the required MSSQL consumer contract',
  )
  record('before-mssql-owned-update', {
    connectorId,
    connectorName: descriptor.connectorName,
    configSha256: hash(finalConfig),
  })
  await api.update(connectorId, { config: finalConfig, reschedule: false })
  check(await api.get(connectorId), finalConfig)
  for (const identity of ['peer', 'anonymous'] as const) {
    apiClient.setAuthToken(identity === 'peer' ? peerToken : null)
    await deny(identity, 'get', () => api.get(connectorId!))
    await deny(identity, 'patch', () =>
      api.update(connectorId!, { config: finalConfig, reschedule: false }),
    )
    await deny(identity, 'delete', () => api.delete(connectorId!))
  }
  apiClient.setAuthToken(ownerToken)
  check(await api.get(connectorId), finalConfig)
  record('mssql-awaiting-sql-readback', {
    connectorId,
    connectorName: descriptor.connectorName,
    source: 'mssql',
    finalConfigSha256: hash(finalConfig),
  })
  const readback = await readSQL()
  assert.ok(
    readback.schemaVersion === 1 &&
      readback.connectorId === connectorId &&
      readback.connectorName === descriptor.connectorName &&
      readback.source === 'mssql' &&
      readback.exists === true,
    'Independent SQL row identity mismatch',
  )
  assert.ok(
    isDeepStrictEqual(readback.config, finalConfig),
    'Independent SQL config mismatch',
  )
  record('mssql-independent-sql-confirmed', {
    connectorId,
    connectorName: descriptor.connectorName,
    finalConfigSha256: hash(finalConfig),
  })
  await deleteOwned()
  console.log(
    JSON.stringify({
      status: 'passed',
      layer: 'actual-Web-domain-API-to-HTTP',
      connectorId,
      connectorName: descriptor.connectorName,
      backendSha: descriptor.backendSha,
      backendVersion: descriptor.backendVersion,
      defaultPort: 1433,
      explicitDeletionSyncFalse: true,
      queryPreserved: true,
      finalConfigSha256: hash(finalConfig),
      independentSQLConfigMatched: true,
      ownedConnectorDeleted: deleted,
      receipts,
      boundary:
        'CRUD and authorization only; no pymssql probe or server SQL-validation claim',
    }),
  )
} catch (error) {
  failure = error
  console.error(
    JSON.stringify({
      status: 'failed',
      error:
        error instanceof APIError
          ? {
              name: error.name,
              status: error.status,
              code: /^\d{1,4}$/.test(error.code)
                ? error.code
                : 'UNEXPECTED_CODE',
            }
          : { name: error instanceof Error ? error.name : 'UnknownError' },
    }),
  )
  process.exitCode = 1
} finally {
  try {
    await deleteOwned()
  } catch (error) {
    record('mssql-owned-cleanup-failed', {
      connectorId,
      connectorName: descriptor.connectorName,
      errorName: error instanceof Error ? error.name : 'UnknownError',
    })
    process.exitCode = 1
  }
  record('mssql-consumer-finished', {
    connectorId,
    connectorName: descriptor.connectorName,
    status: failure || !deleted ? 'failed' : 'passed',
    deleted,
  })
  globalThis.fetch = originalFetch
  apiClient.setAuthToken(null)
  closeSync(fd)
}
