/** Real HTTP consumer for the integrator's registered, isolated application fixture. */
import assert from 'node:assert/strict'
import {
  readFileSync,
  openSync,
  writeSync,
  fsyncSync,
  closeSync,
  constants,
  fstatSync,
} from 'node:fs'
import { apiClient, APIError } from '../src/api/client'
import { createModelProvidersAPI } from '../src/api/llm-providers'
import { projectTenantModels } from '../src/api/llm'
import { chatModelSetting } from '../src/lib/chat/model-setting'
import { buildPDFParserOptions } from '../src/lib/knowledge/pdf-parser-options'

interface Descriptor {
  origin: string
  ownerTokenFile: string
  foreignTokenFile: string
  providerKeyFile: string
  owners: { ownerId: string; foreignId: string }
  providerName: string
  instanceNames: [string, string]
  modelName: string
  scratchDatabase: string
  readbackFile: string
}
interface OwnerReadback {
  providerName: string
  survivingInstanceName: string
  deletedInstanceName: string
  modelIds: { surviving: number; deleted: number }
  expected: {
    base_url: string
    region: string
    has_api_key: boolean
    chat_model_id: number
    ocr_model_id: null
  }
}
const mode = process.env.I_WEB_ACCEPTANCE_MODE
const descriptorPath = process.env.I_WEB_ACCEPTANCE_DESCRIPTOR
assert.ok(
  descriptorPath && process.env.MULTIRAG_RUN_JOURNAL,
  'Use the registered integrator fixture',
)
const descriptor: Descriptor = JSON.parse(readFileSync(descriptorPath, 'utf8'))
const { providerName, instanceNames, modelName, owners } = descriptor
assert.equal(instanceNames.length, 2)
assert.equal(new Set(instanceNames).size, 2)
assert.ok(owners.ownerId && owners.foreignId && descriptor.scratchDatabase)
const origin = new URL(descriptor.origin)
assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(origin.hostname))
const api = createModelProvidersAPI(descriptor.origin)
const fd = openSync(
  process.env.MULTIRAG_RUN_JOURNAL!,
  constants.O_WRONLY | constants.O_APPEND | (constants.O_NOFOLLOW ?? 0),
)
assert.ok(
  fstatSync(fd).isFile(),
  'The canonical journal must be an existing regular file',
)
const record = (kind: string, data: object) => {
  writeSync(fd, JSON.stringify({ kind, ...data }) + '\n')
  fsyncSync(fd)
}
const token = (path: string) => readFileSync(path, 'utf8').trim()
const denied = async (
  action: () => Promise<unknown>,
  expectedStatus: number,
): Promise<number> => {
  let status = 0
  await assert.rejects(action(), (error: unknown) => {
    assert.ok(error instanceof APIError)
    assert.equal(error.status, expectedStatus)
    status = error.status
    return true
  })
  return status
}
async function owner(): Promise<object> {
  apiClient.setAuthToken(token(descriptor.ownerTokenFile))
  assert.equal(
    (await api.providers()).some((row) => row.name === providerName),
    false,
  )
  const before = await api.defaults()
  assert.ok(
    before
      .filter((row) => ['chat', 'ocr'].includes(row.model_type))
      .every((row) => row.model_id === null && row.reference === ''),
  )
  record('reserve-web-provider-rows', {
    scratchDatabase: descriptor.scratchDatabase,
    ownerId: owners.ownerId,
    providerName,
    instanceNames,
    modelName,
    defaults: ['chat', 'ocr'],
  })
  const keys: unknown = JSON.parse(
    readFileSync(descriptor.providerKeyFile, 'utf8'),
  )
  assert.ok(
    Array.isArray(keys) &&
      keys.length === 2 &&
      keys.every((key) => typeof key === 'string' && key.length > 0) &&
      keys[0] !== keys[1],
  )
  await api.createProvider(providerName)
  for (const [index, name] of instanceNames.entries()) {
    await api.createInstance(providerName, {
      instance_name: name,
      api_key: keys[index],
      base_url: `https://w-${index}.invalid`,
      region: '',
      model_ids: [],
    })
    await api.addModel(providerName, name, {
      model_name: modelName,
      model_types: index === 0 ? ['chat', 'image2text'] : ['chat', 'ocr'],
      max_tokens: 0,
      is_tools: false,
    })
  }
  const models = (await api.models()).filter(
    (row) => row.provider_name === providerName && row.name === modelName,
  )
  assert.equal(models.length, 2)
  const first = models.find((row) => row.instance_name === instanceNames[0])!
  const second = models.find((row) => row.instance_name === instanceNames[1])!
  assert.ok(first && second)
  assert.notEqual(first.id, second.id)
  assert.equal(first.max_tokens, 0)
  const projected = projectTenantModels(models)
  assert.equal(
    chatModelSetting(projected, first.reference).model_type,
    'image2text',
  )
  assert.throws(() =>
    chatModelSetting(projected, `${modelName}@${providerName}`),
  )
  assert.ok(
    buildPDFParserOptions(projected, {}).some(
      (row) => row.value === second.reference && row.kind === 'ocr',
    ),
  )
  const instances = await api.instances(providerName)
  assert.equal(instances.length, 2)
  assert.ok(instances.every((row) => !Object.hasOwn(row, 'api_key')))
  await api.updateInstance(providerName, instanceNames[0], {
    api_key: '',
    base_url: 'https://w-edited.invalid',
    region: '',
  })
  const edited = (await api.instances(providerName)).find(
    (row) => row.instance_name === instanceNames[0],
  )!
  assert.equal(edited.has_api_key, true)
  assert.equal(edited.base_url, 'https://w-edited.invalid')
  assert.equal(edited.region, '')
  await api.setDefault('chat', first.id)
  await api.setDefault('ocr', second.id)
  assert.equal(
    (await api.defaults()).find((row) => row.model_type === 'ocr')?.reference,
    second.reference,
  )
  const dependencyStatus = await denied(
    () => api.deleteProvider(providerName),
    409,
  )
  assert.equal(dependencyStatus, 409)
  await api.setModelStatus(providerName, instanceNames[0], first.id, false)
  assert.equal(
    (await api.models()).find((row) => row.id === first.id)?.effective_status,
    'inactive',
  )
  await denied(() => api.setDefault('chat', first.id), 400)
  await api.setModelStatus(providerName, instanceNames[0], first.id, true)
  await api.setDefault('ocr', null)
  await api.deleteInstance(providerName, instanceNames[1])
  assert.equal(
    (await api.instances(providerName)).some(
      (row) => row.instance_name === instanceNames[1],
    ),
    false,
  )
  assert.equal(
    (await api.models()).some((row) => row.id === second.id),
    false,
  )
  return {
    providerName,
    survivingInstanceName: instanceNames[0],
    deletedInstanceName: instanceNames[1],
    modelIds: { surviving: first.id, deleted: second.id },
    expected: {
      base_url: edited.base_url,
      region: '',
      has_api_key: true,
      chat_model_id: first.id,
      ocr_model_id: null,
    },
    dependencyStatus,
    checks: [
      'same-name numeric instance isolation',
      'numeric chat and OCR consumers',
      'legal zero',
      'secret-free inventory',
      'blank credential retention',
      'empty region',
      'default dependency denial',
      'disable and reenable',
      'unreferenced instance deletion',
    ],
  }
}
async function foreign(): Promise<object> {
  const state: OwnerReadback = JSON.parse(
    readFileSync(descriptor.readbackFile, 'utf8'),
  )
  assert.equal(state.providerName, providerName)
  apiClient.setAuthToken(token(descriptor.foreignTokenFile))
  record('reserve-web-foreign-denials', {
    ownerId: owners.ownerId,
    foreignId: owners.foreignId,
    providerName,
    modelId: state.modelIds.surviving,
  })
  const statuses = {
    instances: await denied(() => api.instances(providerName), 404),
    patch: await denied(
      () =>
        api.updateInstance(providerName, state.survivingInstanceName, {
          base_url: 'https://forbidden.invalid',
        }),
      404,
    ),
    default: await denied(
      () => api.setDefault('chat', state.modelIds.surviving),
      404,
    ),
    modelDelete: await denied(
      () =>
        api.deleteModel(
          providerName,
          state.survivingInstanceName,
          state.modelIds.surviving,
        ),
      404,
    ),
    providerDelete: await denied(() => api.deleteProvider(providerName), 404),
  }
  assert.equal(
    (await api.models()).some((row) => row.id === state.modelIds.surviving),
    false,
  )
  return { statuses, ownerModelsHidden: true }
}
async function cleanup(): Promise<object> {
  const state: OwnerReadback = JSON.parse(
    readFileSync(descriptor.readbackFile, 'utf8'),
  )
  assert.equal(state.providerName, providerName)
  apiClient.setAuthToken(token(descriptor.ownerTokenFile))
  record('reserve-web-provider-cleanup', {
    ownerId: owners.ownerId,
    providerName,
    modelIds: state.modelIds,
  })
  await api.setDefault('chat', null)
  await api.setDefault('ocr', null)
  await api.deleteProvider(providerName)
  assert.equal(
    (await api.providers()).some((row) => row.name === providerName),
    false,
  )
  assert.equal(
    (await api.models()).some((row) =>
      Object.values(state.modelIds).includes(row.id),
    ),
    false,
  )
  assert.ok(
    (await api.defaults())
      .filter((row) => ['chat', 'ocr'].includes(row.model_type))
      .every((row) => row.model_id === null && row.reference === ''),
  )
  return { providerAbsent: true, modelsAbsent: true, defaultsCleared: true }
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
      independentSQL: 'integrator-owned',
    }),
  )
} catch (error) {
  console.error(
    JSON.stringify({
      mode,
      status: 'failed',
      name: error instanceof Error ? error.name : 'Unknown',
      apiStatus: error instanceof APIError ? error.status : undefined,
      apiCode: error instanceof APIError ? error.code : undefined,
    }),
  )
  process.exitCode = 1
} finally {
  apiClient.setAuthToken(null)
  closeSync(fd)
}
