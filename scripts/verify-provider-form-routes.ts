/** Actual form builders and domain API against the integrator's isolated HTTP fixture. */
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
  closeSync,
  constants,
  fstatSync,
  fsyncSync,
  openSync,
  readFileSync,
  writeSync,
} from 'node:fs'
import { apiClient, APIError } from '@/api/client'
import { createModelProvidersAPI } from '@/api/llm-providers'
import type { InstanceModelInput, ModelType } from '@/api/llm-provider-types'
import { buildProviderFormCandidate } from '@/pages/settings/model-providers/components/provider-form-candidate'
import {
  createProviderDraft,
  isLocalProvider,
  type ProviderDraft,
} from '@/pages/settings/model-providers/components/provider-form-schema'
import {
  buildConnectionCandidate,
  buildInstancePayload,
} from '@/pages/settings/model-providers/components/instance-payload'

interface Descriptor {
  origin: string
  ownerTokenFile: string
  foreignTokenFile: string
  formsFile: string
  scratchDatabase: string
  readbackFile: string
}
interface FormInput {
  provider: string
  instanceName: string
  values: Partial<ProviderDraft>
}
interface FormReadback {
  provider: string
  instanceName: string
  modelIds: number[]
  credentialSHA256: string
  candidate: {
    base_url: string
    region: string
    custom_model: InstanceModelInput
  }
}
interface OwnerReadback {
  forms: FormReadback[]
  defaults: { model_type: ModelType; model_id: number }[]
  emptyCandidateStatuses: number[]
}

const mode = process.env.I_WEB_ACCEPTANCE_MODE
const descriptorPath = process.env.I_WEB_ACCEPTANCE_DESCRIPTOR
assert.ok(descriptorPath && process.env.MULTIRAG_RUN_JOURNAL)
const descriptor: Descriptor = JSON.parse(readFileSync(descriptorPath, 'utf8'))
const inputs: FormInput[] = JSON.parse(
  readFileSync(descriptor.formsFile, 'utf8'),
)
assert.ok(descriptor.scratchDatabase && inputs.length > 0)
const loopback = (value: string) => {
  const url = new URL(value)
  assert.equal(url.protocol, 'http:')
  assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname))
  assert.ok(!url.username && !url.password)
}
loopback(descriptor.origin)
const api = createModelProvidersAPI(descriptor.origin)
const fd = openSync(
  process.env.MULTIRAG_RUN_JOURNAL!,
  constants.O_WRONLY | constants.O_APPEND | (constants.O_NOFOLLOW ?? 0),
)
assert.ok(fstatSync(fd).isFile())
const record = (kind: string, data: object) => {
  writeSync(fd, JSON.stringify({ kind, ...data }) + '\n')
  fsyncSync(fd)
}
const token = (path: string) => readFileSync(path, 'utf8').trim()
const denied = async (action: () => Promise<unknown>, status: number) => {
  await assert.rejects(action(), (error: unknown) => {
    assert.ok(error instanceof APIError)
    assert.equal(error.status, status)
    return true
  })
  return status
}
const state = (): OwnerReadback =>
  JSON.parse(readFileSync(descriptor.readbackFile, 'utf8'))
const inventory = async () => {
  const providers = await api.providers()
  return {
    providers,
    models: await api.models(),
    defaults: await api.defaults(),
    instances: await Promise.all(
      [...new Set(inputs.map((input) => input.provider))].map(
        async (provider) => ({
          provider,
          items: providers.some((row) => row.name === provider)
            ? await api.instances(provider)
            : [],
        }),
      ),
    ),
  }
}

async function owner(): Promise<OwnerReadback> {
  apiClient.setAuthToken(token(descriptor.ownerTokenFile))
  const ownedProviders = new Set(inputs.map((input) => input.provider))
  assert.ok(
    (await api.providers()).every((row) => !ownedProviders.has(row.name)),
    'The form fixture requires fresh owned provider rows',
  )
  record('reserve-web-form-rows', {
    scratchDatabase: descriptor.scratchDatabase,
    forms: inputs.map(({ provider, instanceName }) => ({
      provider,
      instanceName,
    })),
  })
  const emptyCandidateStatuses: number[] = []
  const router = inputs.find((input) => input.provider === 'OpenRouter')
  if (router) {
    const empty = {
      api_key: router.values.apiKey ?? '',
      base_url: router.values.baseUrl ?? '',
      region: '',
      model_ids: [],
      custom_models: [],
    }
    loopback(empty.base_url)
    const before = await inventory()
    emptyCandidateStatuses.push(
      await denied(() => api.verifyConnection('OpenRouter', empty), 400),
      await denied(
        () =>
          api.createInstance('OpenRouter', {
            instance_name: router.instanceName,
            ...empty,
          }),
        400,
      ),
    )
    assert.deepEqual(await inventory(), before)
  }
  const forms: FormReadback[] = []
  for (const input of inputs) {
    assert.ok(
      ['VolcEngine', 'PaddleOCR', 'OpenRouter'].includes(input.provider),
    )
    const draft = { ...createProviderDraft(input.provider), ...input.values }
    loopback(
      input.provider === 'PaddleOCR' ? draft.paddleocrApiUrl : draft.baseUrl,
    )
    const form = buildProviderFormCandidate(
      input.provider,
      draft,
      isLocalProvider(input.provider),
      true,
    )
    assert.ok(form.ok)
    const candidate = buildConnectionCandidate(
      input.provider,
      form.apiKey,
      form.baseUrl,
      form.fields,
      '',
    )
    assert.ok(candidate.custom_model)
    const before = await inventory()
    const verified = await api.verifyConnection(input.provider, candidate)
    assert.equal(verified.verified, true)
    assert.equal(verified.model_name, candidate.custom_model.model_name)
    assert.ok(candidate.custom_model.model_types.includes(verified.model_type))
    assert.deepEqual(await inventory(), before)
    const { instance } = buildInstancePayload(
      input.provider,
      input.instanceName,
      form.apiKey,
      form.baseUrl,
      form.fields,
      '',
    )
    const { instance_name: _name, ...savedCandidate } = instance
    assert.ok(JSON.stringify(savedCandidate) === JSON.stringify(candidate))
    await api.createInstance(input.provider, instance)
    const models = (await api.models()).filter(
      (row) =>
        row.provider_name === input.provider &&
        row.instance_name === input.instanceName,
    )
    assert.equal(models.length, 1)
    const model = models[0]!
    assert.equal(model.name, candidate.custom_model.model_name)
    assert.deepEqual(model.model_types, candidate.custom_model.model_types)
    assert.equal(model.max_tokens, candidate.custom_model.max_tokens)
    assert.equal(model.is_tools, candidate.custom_model.is_tools)
    const instances = await api.instances(input.provider)
    assert.ok(instances.every((row) => !Object.hasOwn(row, 'api_key')))
    assert.equal(
      instances.find((row) => row.instance_name === input.instanceName)
        ?.has_api_key,
      true,
    )
    forms.push({
      provider: input.provider,
      instanceName: input.instanceName,
      modelIds: models.map((row) => row.id),
      credentialSHA256: createHash('sha256')
        .update(candidate.api_key)
        .digest('hex'),
      candidate: {
        base_url: candidate.base_url,
        region: candidate.region,
        custom_model: candidate.custom_model,
      },
    })
  }
  assert.equal(
    new Set(forms.flatMap((form) => form.modelIds)).size,
    forms.length,
  )
  const defaults: OwnerReadback['defaults'] = []
  for (const form of forms) {
    const type = form.candidate.custom_model.model_types[0]!
    if (defaults.some((row) => row.model_type === type)) continue
    await api.setDefault(type, form.modelIds[0]!)
    defaults.push({ model_type: type, model_id: form.modelIds[0]! })
  }
  for (const form of forms) {
    await api.updateInstance(form.provider, form.instanceName, {
      api_key: '',
      base_url: form.candidate.base_url,
      region: '',
    })
    const instance = (await api.instances(form.provider)).find(
      (row) => row.instance_name === form.instanceName,
    )!
    assert.equal(instance.has_api_key, true)
    assert.equal(instance.base_url, form.candidate.base_url)
  }
  for (const item of defaults)
    assert.equal(
      (await api.defaults()).find((row) => row.model_type === item.model_type)
        ?.model_id,
      item.model_id,
    )
  const result = { forms, defaults, emptyCandidateStatuses }
  record('reserve-web-form-readback', { path: descriptor.readbackFile })
  const out = openSync(descriptor.readbackFile, 'wx', 0o600)
  try {
    writeSync(out, JSON.stringify(result) + '\n')
    fsyncSync(out)
  } finally {
    closeSync(out)
  }
  return result
}

async function foreign() {
  const own = state()
  apiClient.setAuthToken(token(descriptor.foreignTokenFile))
  record('reserve-web-form-foreign-denials', {
    forms: own.forms.map(({ provider, instanceName, modelIds }) => ({
      provider,
      instanceName,
      modelIds,
    })),
  })
  const statuses: number[] = []
  for (const form of own.forms) {
    statuses.push(
      await denied(() => api.instances(form.provider), 404),
      await denied(
        () =>
          api.updateInstance(form.provider, form.instanceName, { api_key: '' }),
        404,
      ),
      await denied(
        () =>
          api.deleteModel(form.provider, form.instanceName, form.modelIds[0]!),
        404,
      ),
      await denied(
        () =>
          api.setDefault(
            form.candidate.custom_model.model_types[0]!,
            form.modelIds[0]!,
          ),
        404,
      ),
    )
  }
  const ids = new Set(own.forms.flatMap((form) => form.modelIds))
  assert.ok((await api.models()).every((model) => !ids.has(model.id)))
  return { statuses, ownerModelsHidden: true }
}

async function cleanup() {
  const own = state()
  apiClient.setAuthToken(token(descriptor.ownerTokenFile))
  const providers = new Set(own.forms.map((form) => form.provider))
  record('reserve-web-form-cleanup', { providers: [...providers] })
  for (const item of own.defaults) await api.setDefault(item.model_type, null)
  for (const provider of providers) await api.deleteProvider(provider)
  assert.ok(
    (await api.providers()).every((provider) => !providers.has(provider.name)),
  )
  const ids = new Set(own.forms.flatMap((form) => form.modelIds))
  assert.ok((await api.models()).every((model) => !ids.has(model.id)))
  return { providersAbsent: true, modelsAbsent: true }
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
      layer: 'actual-Web-form-to-HTTP',
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
    }),
  )
  process.exitCode = 1
} finally {
  apiClient.setAuthToken(null)
  closeSync(fd)
}
