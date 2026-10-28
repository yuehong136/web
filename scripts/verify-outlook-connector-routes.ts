/** Actual Outlook domain client against an owned HTTP/JWT/Graph fixture. */
import assert from 'node:assert/strict'
import {
  constants,
  readFileSync,
  openSync,
  writeSync,
  fsyncSync,
  closeSync,
  fstatSync,
} from 'node:fs'
import { APIError, apiClient } from '../src/api/client'
import { createDatasourceConnectorAPI } from '../src/api/datasource'
import { DataSourceKey } from '../src/pages/settings/datasource/types'
import {
  getDataSourceDefaultValues,
  prepareDataSourceValues,
} from '../src/pages/settings/datasource/constants/form-values'

interface Descriptor {
  origin: string
  ownerTokenFile: string
  foreignTokenFile: string
  owners: { ownerId: string; foreignId: string }
  scratchDatabase: string
  readbackFile: string
  connectorCredentials: {
    tenant_id: string
    client_id: string
    client_secret: string
  }
  connectorName?: string
  forbiddenMailbox?: string
}
const mode = process.env.I_WEB_ACCEPTANCE_MODE
const descriptorPath = process.env.I_WEB_ACCEPTANCE_DESCRIPTOR
assert.ok(descriptorPath && process.env.MULTIRAG_RUN_JOURNAL)
const descriptor: Descriptor = JSON.parse(readFileSync(descriptorPath, 'utf8'))
assert.ok(
  ['127.0.0.1', 'localhost', '[::1]'].includes(
    new URL(descriptor.origin).hostname,
  ),
)
assert.ok(
  descriptor.scratchDatabase &&
    descriptor.owners.ownerId &&
    descriptor.owners.foreignId,
)
const fd = openSync(
  process.env.MULTIRAG_RUN_JOURNAL!,
  constants.O_WRONLY | constants.O_APPEND | (constants.O_NOFOLLOW ?? 0),
)
assert.ok(fstatSync(fd).isFile())
const record = (kind: string, data: object) => {
  writeSync(fd, JSON.stringify({ kind, ...data }) + '\n')
  fsyncSync(fd)
}
const api = createDatasourceConnectorAPI(descriptor.origin)
const auth = (path: string) =>
  apiClient.setAuthToken(readFileSync(path, 'utf8').trim())
async function denied(action: () => Promise<unknown>, code: string) {
  await assert.rejects(action(), (error: unknown) => {
    assert.ok(error instanceof APIError)
    assert.equal(error.status, 200)
    assert.equal(error.code, code)
    return true
  })
  return { httpStatus: 200, code }
}
const savedId = (): string => {
  const row = JSON.parse(readFileSync(descriptor.readbackFile, 'utf8'))
  assert.ok(typeof row.ids.outlook === 'string' && row.ids.outlook)
  return row.ids.outlook
}
async function owner() {
  auth(descriptor.ownerTokenFile)
  const name =
    descriptor.connectorName ?? `W-${descriptor.owners.ownerId}-outlook`
  assert.equal(
    (await api.list()).some((row) => row.name === name),
    false,
  )
  record('reserve-web-outlook-connector', {
    name,
    ownerId: descriptor.owners.ownerId,
    scratchDatabase: descriptor.scratchDatabase,
  })
  const values = getDataSourceDefaultValues(DataSourceKey.OUTLOOK)
  values.config = {
    ...values.config,
    credentials: {
      ...descriptor.connectorCredentials,
      consumer_extension: 'retained',
    },
    consumer_extension: { zero: 0 },
    batch_size: '',
    sync_batch_size: null,
    sync_deleted_files: true,
  }
  const created = await api.set({
    name,
    source: DataSourceKey.OUTLOOK,
    config: prepareDataSourceValues(DataSourceKey.OUTLOOK, values).config!,
    refresh_freq: 0,
    prune_freq: 0,
  })
  assert.ok(created.id)
  const ids = { outlook: created.id }
  record('created-web-outlook-connector-id', { ids })
  const initial = await api.get(created.id)
  assert.equal(initial.source, 'outlook')
  assert.equal(initial.tenant_id, descriptor.owners.ownerId)
  assert.deepEqual(initial.config.user_ids, [])
  assert.equal(initial.config.folder, 'inbox')
  assert.equal(initial.config.sync_deleted_files, false)
  assert.equal(Object.hasOwn(initial.config, 'batch_size'), false)
  assert.equal(Object.hasOwn(initial.config, 'sync_batch_size'), false)
  const empty = await denied(() => api.test(created.id), '102')
  const edited = getDataSourceDefaultValues(DataSourceKey.OUTLOOK, initial)
  edited.config = {
    ...edited.config,
    user_ids: ['A', 'B'],
    folder: 'inbox',
    batch_size: 1,
    sync_deleted_files: true,
  }
  await api.update(created.id, {
    config: prepareDataSourceValues(
      DataSourceKey.OUTLOOK,
      edited,
      initial.config,
    ).config,
    reschedule: false,
  })
  const final = await api.get(created.id)
  assert.deepEqual(final.config.user_ids, ['A', 'B'])
  assert.equal(final.config.folder, 'inbox')
  assert.equal(final.config.batch_size, 1)
  assert.equal(final.config.sync_deleted_files, false)
  assert.deepEqual(final.config.consumer_extension, { zero: 0 })
  assert.equal(final.config.credentials.consumer_extension, 'retained')
  const result = await api.test(created.id)
  assert.ok(typeof result.message === 'string' && result.message)
  assert.deepEqual(
    (await api.get(created.id)).config,
    final.config,
    'probe must not alter config',
  )
  let permissionFailure
  if (descriptor.forbiddenMailbox) {
    await api.update(created.id, {
      config: { ...final.config, user_ids: [descriptor.forbiddenMailbox] },
      reschedule: false,
    })
    permissionFailure = await denied(() => api.test(created.id), '102')
    await api.update(created.id, { config: final.config, reschedule: false })
  }
  return {
    ids,
    name,
    probes: {
      empty,
      success: { httpStatus: 200, code: '0' },
      permissionFailure,
    },
    finalScope: ['A', 'B'],
    syncDeletedFiles: false,
    independentSQLAndGraph: 'C-owned',
  }
}
async function foreign() {
  const id = savedId()
  auth(descriptor.foreignTokenFile)
  record('reserve-web-outlook-foreign-denials', {
    id,
    foreignId: descriptor.owners.foreignId,
  })
  const denials = {
    get: await denied(() => api.get(id), '109'),
    patch: await denied(
      () => api.update(id, { config: { user_ids: ['forbidden'] } }),
      '109',
    ),
    probe: await denied(() => api.test(id), '109'),
    delete: await denied(() => api.delete(id), '109'),
  }
  assert.equal(
    (await api.list()).some((row) => row.id === id),
    false,
  )
  return { ids: { outlook: id }, denials, independentSQLAndGraph: 'C-owned' }
}
async function cleanup() {
  const id = savedId()
  auth(descriptor.ownerTokenFile)
  record('reserve-web-outlook-cleanup', {
    id,
    ownerId: descriptor.owners.ownerId,
  })
  await api.delete(id)
  assert.equal(
    (await api.list()).some((row) => row.id === id),
    false,
  )
  return {
    ids: { outlook: id },
    connectorsAbsent: true,
    independentSQL: 'C-owned',
  }
}
try {
  assert.ok(['owner', 'foreign', 'cleanup'].includes(mode ?? ''))
  const result = await (mode === 'owner'
    ? owner()
    : mode === 'foreign'
      ? foreign()
      : cleanup())
  console.log(
    JSON.stringify({
      mode,
      status: 'passed',
      layer: 'actual-Web-domain-API-to-HTTP',
      ...result,
    }),
  )
} catch (error) {
  console.error(
    JSON.stringify({
      mode,
      status: 'failed',
      error:
        error instanceof APIError
          ? { name: error.name, status: error.status, code: error.code }
          : { name: error instanceof Error ? error.name : 'UnknownError' },
    }),
  )
  process.exitCode = 1
} finally {
  closeSync(fd)
}
