/** Actual domain clients against the integrator's isolated HTTP/JWT/Graph fixture. */
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
import {
  DataSourceKey,
  type IDataSource,
} from '../src/pages/settings/datasource/types'
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
  connectorNames?: [string, string]
}
interface Readback {
  ids: { teams: string; onedrive: string }
}
const mode = process.env.I_WEB_ACCEPTANCE_MODE
const descriptorPath = process.env.I_WEB_ACCEPTANCE_DESCRIPTOR
assert.ok(
  descriptorPath && process.env.MULTIRAG_RUN_JOURNAL,
  'Use the registered integrator fixture',
)
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
for (const key of ['tenant_id', 'client_id', 'client_secret'] as const)
  assert.ok(
    typeof descriptor.connectorCredentials[key] === 'string' &&
      descriptor.connectorCredentials[key],
  )
const fd = openSync(
  process.env.MULTIRAG_RUN_JOURNAL!,
  constants.O_WRONLY | constants.O_APPEND | (constants.O_NOFOLLOW ?? 0),
)
assert.ok(
  fstatSync(fd).isFile(),
  'The canonical journal must be an existing regular file',
)
const record = (kind: string, data: object) => {
  writeSync(fd, JSON.stringify({ kind, ...data }) + String.fromCharCode(10))
  fsyncSync(fd)
}
const api = createDatasourceConnectorAPI(descriptor.origin)
const auth = (path: string) =>
  apiClient.setAuthToken(readFileSync(path, 'utf8').trim())
const rawFolder = '文档/a#b?c%literal'
const extension = { retained: true, version: 1 }
const credentialExtension = { retained: 'opaque-microsoft-field' }
function prepared(
  source: DataSourceKey.TEAMS | DataSourceKey.ONEDRIVE,
  detail?: IDataSource,
) {
  const values = getDataSourceDefaultValues(source, detail)
  values.config = {
    ...values.config,
    consumer_extension: extension,
    credentials: {
      ...(values.config?.credentials as object),
      ...descriptor.connectorCredentials,
      consumer_extension: credentialExtension,
    },
    batch_size: '',
    sync_batch_size: null,
    sync_deleted_files: true,
    ...(source === DataSourceKey.ONEDRIVE
      ? { drive_ids: [], folder_path: rawFolder }
      : {}),
  }
  return prepareDataSourceValues(source, values, detail?.config).config!
}
function check(
  row: IDataSource,
  source: DataSourceKey,
  initialDriveScope = false,
) {
  assert.equal(row.source, source)
  assert.equal(row.tenant_id, descriptor.owners.ownerId)
  assert.equal(row.config.sync_deleted_files, false)
  assert.equal(Object.hasOwn(row.config, 'batch_size'), false)
  assert.equal(Object.hasOwn(row.config, 'sync_batch_size'), false)
  assert.deepEqual(row.config.consumer_extension, extension)
  assert.deepEqual(
    row.config.credentials.consumer_extension,
    credentialExtension,
  )
  for (const key of ['tenant_id', 'client_id', 'client_secret'] as const)
    assert.equal(
      row.config.credentials[key],
      descriptor.connectorCredentials[key],
    )
  if (source === DataSourceKey.ONEDRIVE && initialDriveScope) {
    assert.deepEqual(row.config.drive_ids, [])
    assert.equal(row.config.folder_path, rawFolder)
  }
}
async function businessDenied(
  action: () => Promise<unknown>,
  code: '102' | '109',
) {
  await assert.rejects(action(), (error: unknown) => {
    assert.ok(error instanceof APIError)
    assert.equal(error.status, 200)
    assert.equal(error.code, code)
    return true
  })
  return { httpStatus: 200, code }
}
async function owner() {
  auth(descriptor.ownerTokenFile)
  const names = descriptor.connectorNames ?? [
    `W-${descriptor.owners.ownerId}-teams`,
    `W-${descriptor.owners.ownerId}-onedrive`,
  ]
  assert.equal(new Set(names).size, 2)
  assert.equal(
    (await api.list()).some((row) => names.includes(row.name)),
    false,
  )
  record('reserve-web-microsoft-connectors', {
    scratchDatabase: descriptor.scratchDatabase,
    ownerId: descriptor.owners.ownerId,
    names,
    sources: ['teams', 'onedrive'],
  })
  const teams = await api.set({
    name: names[0],
    source: DataSourceKey.TEAMS,
    config: prepared(DataSourceKey.TEAMS),
    refresh_freq: 0,
    prune_freq: 0,
  })
  const onedrive = await api.set({
    name: names[1],
    source: DataSourceKey.ONEDRIVE,
    config: prepared(DataSourceKey.ONEDRIVE),
    refresh_freq: 0,
    prune_freq: 0,
  })
  assert.ok(teams.id && onedrive.id && teams.id !== onedrive.id)
  const ids = { teams: teams.id, onedrive: onedrive.id }
  record('created-web-microsoft-connector-ids', { ids })
  check(await api.get(teams.id), DataSourceKey.TEAMS)
  check(await api.get(onedrive.id), DataSourceKey.ONEDRIVE, true)
  const emptyProbe = await businessDenied(() => api.test(onedrive.id), '102')
  const teamsConfig = prepared(DataSourceKey.TEAMS, await api.get(teams.id))
  await api.update(teams.id, {
    config: { ...teamsConfig, consumer_patch: 'teams-updated' },
    reschedule: false,
  })
  const driveConfig = prepared(
    DataSourceKey.ONEDRIVE,
    await api.get(onedrive.id),
  )
  await api.update(onedrive.id, {
    config: {
      ...driveConfig,
      drive_ids: ['A', 'B'],
      folder_path: '',
      consumer_patch: 'onedrive-updated',
    },
    reschedule: false,
  })
  const finalTeams = await api.get(teams.id),
    finalDrive = await api.get(onedrive.id)
  check(finalTeams, DataSourceKey.TEAMS)
  check(finalDrive, DataSourceKey.ONEDRIVE)
  assert.equal(finalTeams.config.consumer_patch, 'teams-updated')
  assert.equal(finalDrive.config.consumer_patch, 'onedrive-updated')
  assert.deepEqual(finalDrive.config.drive_ids, ['A', 'B'])
  assert.equal(finalDrive.config.folder_path, '')
  const teamsProbe = await api.test(teams.id),
    driveProbe = await api.test(onedrive.id)
  assert.equal(typeof teamsProbe.message, 'string')
  assert.ok(teamsProbe.message)
  assert.equal(typeof driveProbe.message, 'string')
  assert.ok(driveProbe.message)
  return {
    ids,
    names,
    probes: {
      empty: emptyProbe,
      teams: { httpStatus: 200, code: '0' },
      onedrive: { httpStatus: 200, code: '0' },
    },
    configSummary: {
      initialDriveIds: [],
      rawFolder,
      finalDriveIds: ['A', 'B'],
      finalFolder: '',
      syncDeletedFiles: false,
      batchFieldsOmitted: true,
      unknownConfigAndCredentialFieldsRetained: true,
      patched: true,
    },
    independentGraphAndSQL: 'integrator-owned',
  }
}
async function foreign() {
  const { ids }: Readback = JSON.parse(
    readFileSync(descriptor.readbackFile, 'utf8'),
  )
  assert.ok(ids.teams && ids.onedrive && ids.teams !== ids.onedrive)
  auth(descriptor.foreignTokenFile)
  record('reserve-web-microsoft-foreign-denials', {
    ids,
    ownerId: descriptor.owners.ownerId,
    foreignId: descriptor.owners.foreignId,
  })
  const denied: Record<string, object> = {}
  for (const [source, id] of Object.entries(ids)) {
    denied[source] = {
      get: await businessDenied(() => api.get(id), '109'),
      patch: await businessDenied(
        () => api.update(id, { config: { consumer_patch: 'forbidden' } }),
        '109',
      ),
      probe: await businessDenied(() => api.test(id), '109'),
      delete: await businessDenied(() => api.delete(id), '109'),
    }
  }
  const listed = await api.list()
  assert.equal(
    listed.some((row) => Object.values(ids).includes(row.id)),
    false,
  )
  return {
    ids,
    denied,
    ownerConnectorsHidden: true,
    independentGraphAndSQL: 'integrator-owned',
  }
}
async function cleanup() {
  const { ids }: Readback = JSON.parse(
    readFileSync(descriptor.readbackFile, 'utf8'),
  )
  assert.ok(ids.teams && ids.onedrive && ids.teams !== ids.onedrive)
  auth(descriptor.ownerTokenFile)
  record('reserve-web-microsoft-cleanup', {
    ids,
    ownerId: descriptor.owners.ownerId,
  })
  for (const id of Object.values(ids)) await api.delete(id)
  assert.equal(
    (await api.list()).some((row) => Object.values(ids).includes(row.id)),
    false,
  )
  return { ids, connectorsAbsent: true, independentSQL: 'integrator-owned' }
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
          : error instanceof Error
            ? { name: error.name }
            : { name: 'UnknownError' },
    }),
  )
  process.exitCode = 1
} finally {
  closeSync(fd)
}
