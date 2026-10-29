/**
 * Real Web consumer against an explicitly owned local Agent history service.
 * Run with tsx --tsconfig <webSourceRoot>/tsconfig.app.json <script> <descriptor>.
 * Only the configured API origin is redirected; API methods, request bodies,
 * authentication, native fetch, response parsing and citation helpers are real.
 * SQL readback belongs to the fixture owner and is never simulated here.
 */
import {
  closeSync,
  existsSync,
  fsyncSync,
  openSync,
  readFileSync,
  realpathSync,
  statSync,
  writeFileSync,
  writeSync,
} from 'node:fs'
import { createHash, randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { readAgentHistoryDescriptor } from './agent-history-descriptor'
import type * as AgentModule from '@/api/agent'
import type * as ClientModule from '@/api/client'
import type * as ConstantsModule from '@/constants'
import type * as ReferenceModule from '@/utils/reference-replacer'
import type * as LookupModule from '@/utils/reference-utils'

type Principal = 'anonymous' | 'peer' | 'owner'
interface Receipt {
  principal: Principal
  method: string
  path: string
  status: number
  businessCode?: number
  bodySHA256: string
  bodyBytes: number
}
const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)
class ConsumerCheckFailure extends Error {}
function check(condition: unknown, label: string): asserts condition {
  if (!condition) throw new ConsumerCheckFailure(label)
}
const sha256 = (value: string | Uint8Array) =>
  createHash('sha256').update(value).digest('hex')
const absolute = (value: unknown): value is string =>
  typeof value === 'string' && path.isAbsolute(value)

function token(file: string): string {
  check(
    statSync(file).isFile() && (statSync(file).mode & 0o077) === 0,
    'private-token-file',
  )
  const value = readFileSync(file, 'utf8').trim()
  check(value.length > 0 && !/\s/.test(value), 'nonempty-private-token')
  return value
}
function session(value: unknown, id: string, agentId: string) {
  check(
    isRecord(value) && value.id === id && value.agent_id === agentId,
    'session-identity',
  )
  check(Array.isArray(value.messages), 'session-messages')
  check(
    value.messages.every(
      (message) => isRecord(message) && !Object.hasOwn(message, 'prompt'),
    ),
    'prompt-redaction',
  )
  return value
}
function listing(value: unknown, ids: string[], agentId: string) {
  check(
    isRecord(value) && Array.isArray(value.sessions),
    'list-sessions-envelope',
  )
  check(
    Number.isSafeInteger(value.total) && value.total === ids.length,
    'list-total',
  )
  check(value.sessions.length === ids.length, 'list-page-completeness')
  const actual = value.sessions
    .map((item) => {
      check(isRecord(item) && typeof item.id === 'string', 'list-session-id')
      session(item, item.id, agentId)
      return item.id
    })
    .sort()
  check(
    JSON.stringify(actual) === JSON.stringify([...ids].sort()),
    'list-exact-session-set',
  )
  return value.sessions
}

async function main() {
  check(
    process.argv.length === 3 && absolute(process.argv[2]),
    'absolute-descriptor-argument',
  )
  const descriptorFile = realpathSync(process.argv[2])
  const d = readAgentHistoryDescriptor(descriptorFile)
  const evidenceRoot = realpathSync(d.evidenceRoot)
  check(statSync(evidenceRoot).isDirectory(), 'existing-evidence-root')
  const runId = randomUUID()
  const outputFile = path.join(evidenceRoot, `agent-history-${runId}.json`)
  const journalFile = path.join(evidenceRoot, `agent-history-${runId}.jsonl`)
  const journal = openSync(journalFile, 'wx', 0o600)
  const event = (type: string, fields: Record<string, unknown> = {}) => {
    writeSync(
      journal,
      JSON.stringify({
        event: type,
        utc: new Date().toISOString(),
        runId,
        ...fields,
      }) + '\n',
    )
    fsyncSync(journal)
  }
  // Reserve durable evidence and the one allowed mutation before product import/I/O.
  event('reserve-before-consumer', {
    outputFile,
    journalFile,
    descriptorFile,
    descriptorSHA256: sha256(readFileSync(descriptorFile)),
    source: realpathSync(d.webSourceRoot),
    borrowedOrigin: d.ownedOrigin,
    borrowedTokenFiles: [d.ownerTokenFile, d.peerTokenFile],
    borrowedSQLReadback: d.readbackFile,
    ownedDeletion: d.deletionOwned,
    backendSha: d.backendSha,
    backendVersion: d.backendVersion,
  })
  let principal: Principal = 'anonymous'
  let stage = 'source-fingerprint'
  let clearAuth = () => {}
  const receipts: Receipt[] = []
  const assertions: string[] = []
  const nativeFetch = globalThis.fetch.bind(globalThis)
  let deleteArmed = false
  let denialDeleteArmed = false
  const report: Record<string, unknown> = {
    schemaVersion: 1,
    runId,
    status: 'running',
    outputFile,
    journalFile,
    boundary:
      'Real Web agentAPI and citation helpers; only configured API origin redirects to ownedOrigin. Native HTTP and business responses are not mocked. Redirects are rejected.',
    backendSha: d.backendSha,
    backendVersion: d.backendVersion,
    sqlReadback: {
      path: d.readbackFile,
      executedByScript: false,
      owner: 'fixture owner / I',
    },
    receipts,
    assertions,
  }
  try {
    const source = realpathSync(d.webSourceRoot)
    const webSha = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: source,
      encoding: 'utf8',
    }).trim()
    if (d.webSha !== undefined) check(d.webSha === webSha, 'fixed-web-sha')
    report.webSha = webSha
    report.trackedDiffSHA256 = sha256(
      execFileSync(
        'git',
        [
          'diff',
          'HEAD',
          '--',
          'src',
          'scripts/verify-agent-history-routes.ts',
          'package.json',
          'package-lock.json',
        ],
        { cwd: source },
      ),
    )
    const sourceFiles = [
      'src/api/agent.ts',
      'src/api/client.ts',
      'src/api/client-types.ts',
      'src/api/response-error.ts',
      'src/utils/reference-replacer.ts',
      'src/utils/reference-utils.ts',
      'src/constants/index.ts',
      'tsconfig.app.json',
      'package.json',
      'package-lock.json',
    ]
    report.sourceHashes = Object.fromEntries(
      sourceFiles.map((file) => [
        file,
        sha256(readFileSync(path.join(source, file))),
      ]),
    )
    report.scriptSHA256 = sha256(readFileSync(fileURLToPath(import.meta.url)))
    report.descriptorHelperSHA256 = sha256(
      readFileSync(new URL('./agent-history-descriptor.ts', import.meta.url)),
    )
    event('fixed-inputs', {
      webSha,
      sourceHashes: report.sourceHashes,
      scriptSHA256: report.scriptSHA256,
    })
    const load = (file: string) =>
      import(pathToFileURL(path.join(source, file)).href)
    stage = 'actual-product-module-imports'
    const { agentAPI }: typeof AgentModule = await load('src/api/agent.ts')
    const { apiClient, APIError }: typeof ClientModule =
      await load('src/api/client.ts')
    const { API_BASE_URL }: typeof ConstantsModule = await load(
      'src/constants/index.ts',
    )
    const { extractReferencesFromSSEData }: typeof ReferenceModule = await load(
      'src/utils/reference-replacer.ts',
    )
    const { getChunkByRefId }: typeof LookupModule = await load(
      'src/utils/reference-utils.ts',
    )
    clearAuth = () => apiClient.setAuthToken(null)
    const configured = new URL(API_BASE_URL)
    check(
      configured.pathname === '/' && !configured.search && !configured.hash,
      'configured-api-origin-only',
    )
    const sessionsPath = `/api/v1/agents/${encodeURIComponent(d.agentId)}/sessions`
    const allowedPaths = new Set([
      sessionsPath,
      `${sessionsPath}/${encodeURIComponent(d.sparseSessionId)}`,
      `${sessionsPath}/${encodeURIComponent(d.deleteSessionId)}`,
    ])
    report.originRedirect = {
      from: configured.origin,
      to: d.ownedOrigin,
      allowedPaths: [...allowedPaths],
    }
    globalThis.fetch = async (input, init) => {
      check(
        typeof input === 'string' || input instanceof URL,
        'string-or-url-native-request',
      )
      const url = new URL(String(input))
      check(
        url.origin === configured.origin && allowedPaths.has(url.pathname),
        'exact-configured-origin-and-agent-session-path',
      )
      check(
        !url.username && !url.password && !url.hash,
        'no-request-url-credentials',
      )
      check(
        [...url.searchParams.keys()].every((key) =>
          ['page', 'page_size'].includes(key),
        ),
        'only-pagination-query',
      )
      const method = (init?.method ?? 'GET').toUpperCase()
      check(
        method === 'GET' || method === 'DELETE',
        'read-or-owned-delete-only',
      )
      if (method === 'DELETE') {
        check(
          ((deleteArmed && principal === 'owner') ||
            (denialDeleteArmed && principal !== 'owner')) &&
            url.pathname ===
              `${sessionsPath}/${encodeURIComponent(d.deleteSessionId)}`,
          'armed-exact-owned-delete',
        )
        deleteArmed = false
        denialDeleteArmed = false
        event('owned-delete-dispatch', {
          agentId: d.agentId,
          sessionId: d.deleteSessionId,
          principal,
        })
      }
      const redirected = new URL(url.pathname + url.search, d.ownedOrigin)
      const response = await nativeFetch(redirected, {
        ...init,
        redirect: 'error',
      })
      const bytes = new Uint8Array(await response.clone().arrayBuffer())
      let businessCode: number | undefined
      try {
        const body: unknown = JSON.parse(new TextDecoder().decode(bytes))
        if (isRecord(body)) {
          const code = body.retcode ?? body.code
          if (typeof code === 'number') businessCode = code
        }
      } catch {
        /* Non-JSON remains a real APIClient failure. */
      }
      const receipt = {
        principal,
        method,
        path: url.pathname + url.search,
        status: response.status,
        businessCode,
        bodySHA256: sha256(bytes),
        bodyBytes: bytes.byteLength,
      }
      receipts.push(receipt)
      event('http-response', receipt)
      return response
    }
    const denied = async (
      label: string,
      operation: () => Promise<unknown>,
      kind: 'auth' | 'peer' | 'missing',
    ) => {
      try {
        await operation()
      } catch (error) {
        check(error instanceof APIError, `${label}-typed-api-error`)
        const accepted =
          kind === 'auth'
            ? [401, 403].includes(error.status) ||
              (error.status === 200 && ['109', '401'].includes(error.code))
            : kind === 'peer'
              ? [403, 404].includes(error.status) ||
                (error.status === 200 && error.code === '103')
              : error.status === 404 ||
                (error.status === 200 && error.code === '102')
        check(accepted, `${label}-expected-status-business-code`)
        assertions.push(label)
        return
      }
      check(false, `${label}-unexpected-success`)
    }
    const denialChecks: {
      principal: Principal
      file?: string
      kind: 'auth' | 'peer'
    }[] = [
      { principal: 'anonymous', kind: 'auth' },
      { principal: 'peer', file: d.peerTokenFile, kind: 'peer' },
    ]
    for (const actor of denialChecks) {
      stage = `${actor.principal}-denials`
      principal = actor.principal
      apiClient.setAuthToken(actor.file ? token(actor.file) : null)
      await denied(
        `${principal}-list-denied`,
        () => agentAPI.fetchSessions(d.agentId),
        actor.kind,
      )
      await denied(
        `${principal}-detail-denied`,
        () => agentAPI.fetchSession(d.agentId, d.sparseSessionId),
        actor.kind,
      )
      denialDeleteArmed = true
      await denied(
        `${principal}-delete-denied`,
        () => agentAPI.deleteSession(d.agentId, d.deleteSessionId),
        actor.kind,
      )
    }
    stage = 'owner-history'
    principal = 'owner'
    apiClient.setAuthToken(token(d.ownerTokenFile))
    const fetchSessions = () =>
      agentAPI.fetchSessions(d.agentId, { page: 1, page_size: 100 })
    const fetchSession = (id: string) => agentAPI.fetchSession(d.agentId, id)
    const before = listing(
      await fetchSessions(),
      d.expectedSessionIds,
      d.agentId,
    )
    const detail = session(
      await fetchSession(d.sparseSessionId),
      d.sparseSessionId,
      d.agentId,
    )
    const listed = before.find(
      (item) => isRecord(item) && item.id === d.sparseSessionId,
    )
    check(
      isRecord(listed) &&
        JSON.stringify(listed.messages) === JSON.stringify(detail.messages),
      'list-detail-message-parity',
    )
    assertions.push(
      'owner-list-total-and-exact-sessions',
      'owner-detail-and-list-parity',
    )
    const messages = detail.messages
    check(Array.isArray(messages), 'detail-message-array')
    const sparse = messages.find(
      (message) =>
        isRecord(message) &&
        Array.isArray(message.reference) &&
        JSON.stringify(
          message.reference.map((ref) =>
            isRecord(ref) ? ref.citation_id : null,
          ),
        ) === '["1","3"]',
    )
    check(
      isRecord(sparse) && Array.isArray(sparse.reference),
      'sparse-citation-1-3-fixture',
    )
    for (const ref of sparse.reference) {
      check(isRecord(ref), 'raw-reference-record')
      for (const key of [
        'document_id',
        'document_name',
        'dataset_id',
        'image_id',
        'positions',
      ])
        check(
          ref[key] === null || ref[key] === undefined,
          'legacy-id-no-invented-document-metadata',
        )
      check(
        !Object.hasOwn(ref, 'doc_type') &&
          !Object.hasOwn(ref, 'doc_type_kwd') &&
          !Object.hasOwn(ref, 'document_metadata'),
        'legacy-id-no-invented-document-type',
      )
    }
    check(
      sparse.reference.some(
        (ref) => isRecord(ref) && ref.id === 0 && ref.content === '0',
      ),
      'server-numeric-zero-id-and-content',
    )
    const references = extractReferencesFromSSEData({
      chunks: sparse.reference,
    })
    check(references.length === 2, 'parsed-sparse-reference-count')
    check(
      references.some((ref) => ref.id === 0 && ref.content === '0'),
      'numeric-zero-id-and-content-preserved',
    )
    for (const ref of references) {
      for (const key of [
        'document_id',
        'document_name',
        'dataset_id',
        'image_id',
      ] as const)
        check(
          ref[key] === undefined || ref[key] === null || ref[key] === '',
          'parsed-legacy-no-invented-document-metadata',
        )
      check(
        ref.doc_type === undefined &&
          ref.doc_type_kwd === undefined &&
          ref.document_metadata === undefined,
        'parsed-legacy-no-invented-document-type',
      )
    }
    const one = getChunkByRefId('1', references),
      three = getChunkByRefId('3', references)
    check(
      one?.citation_id === '1' && three?.citation_id === '3' && one !== three,
      'id-1-and-3-exact-current-lookup',
    )
    check(
      getChunkByRefId('0', references) === undefined &&
        getChunkByRefId('2', references) === undefined,
      'no-compacted-marker-rebinding',
    )
    report.referenceIds = references.map((ref) => ref.id)
    report.citationKeys = references.map((ref) => ref.reference_key)
    report.referenceContentsSHA256 = references.map((ref) =>
      sha256(ref.content),
    )
    assertions.push(
      'sparse-citation-1-3-current-parser-and-lookup',
      'numeric-zero-preserved-without-fabricated-metadata',
    )
    stage = 'owned-delete'
    session(await fetchSession(d.deleteSessionId), d.deleteSessionId, d.agentId)
    event('reserve-owned-delete', {
      agentId: d.agentId,
      sessionId: d.deleteSessionId,
      authorization: d.deletionOwned,
    })
    deleteArmed = true
    check(
      (await agentAPI.deleteSession(d.agentId, d.deleteSessionId)) === 1,
      'owned-delete-business-result',
    )
    await denied(
      'deleted-detail-missing',
      () => fetchSession(d.deleteSessionId),
      'missing',
    )
    listing(
      await fetchSessions(),
      d.expectedSessionIds.filter((id) => id !== d.deleteSessionId),
      d.agentId,
    )
    session(await fetchSession(d.sparseSessionId), d.sparseSessionId, d.agentId)
    for (const actor of ['anonymous', 'peer', 'owner'])
      check(
        receipts.filter(
          (receipt) =>
            receipt.method === 'DELETE' && receipt.principal === actor,
        ).length === 1,
        'one-exact-owned-fixture-delete-attempt-per-principal',
      )
    assertions.push(
      'owned-delete-confirmed-by-detail-and-list',
      'sparse-session-preserved-after-owned-delete',
    )
    if (existsSync(d.readbackFile))
      report.sqlReadbackFileSHA256 = sha256(readFileSync(d.readbackFile))
    report.status = 'http-consumer-passed-sql-readback-owned-by-integrator'
  } catch (error) {
    report.status = 'failed'
    // Never print APIError.message/details, response bodies or credential data.
    report.failure = {
      stage,
      check:
        error instanceof ConsumerCheckFailure
          ? error.message
          : 'unexpected-consumer-error',
    }
    process.exitCode = 1
  } finally {
    clearAuth()
    globalThis.fetch = nativeFetch
    event('reserve-report-write', { outputFile })
    const fd = openSync(outputFile, 'wx', 0o600)
    try {
      writeFileSync(fd, JSON.stringify(report, null, 2) + '\n')
      fsyncSync(fd)
    } finally {
      closeSync(fd)
    }
    event('finished', {
      status: report.status,
      outputFile,
      exitCode: process.exitCode ?? 0,
      resourcesCreated: [],
      borrowedResourcesDeleted: false,
    })
    closeSync(journal)
    process.stdout.write(
      JSON.stringify({ status: report.status, outputFile, journalFile }) + '\n',
    )
  }
}

main().catch(() => {
  process.stderr.write(
    'Agent history consumer failed before execution; inspect the descriptor and durable journal.\n',
  )
  process.exitCode = 1
})
