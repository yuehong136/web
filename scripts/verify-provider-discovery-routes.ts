/** Real apiClient consumer for a registered isolated Python application/provider fixture. */
import assert from 'node:assert/strict'
import {
  readFileSync,
  writeFileSync,
  openSync,
  writeSync,
  fsyncSync,
  closeSync,
  constants,
  fstatSync,
} from 'node:fs'
import { apiClient, APIError } from '../src/api/client'
import { createModelProvidersAPI } from '../src/api/llm-providers'
import type { ConnectionCandidate } from '../src/api/llm-provider-types'

interface Descriptor {
  origin: string
  ownerTokenFile: string
  providerKeyFile: string
  providerName: string
  discovery: { base_url: string; region: string }
  ownerId: string
  instanceName: string
  readbackFile: string
  scratchDatabase: string
  invalidBaseURL?: string
  modelName?: string
}
const path = process.env.I_WEB_ACCEPTANCE_DESCRIPTOR
assert.ok(
  path && process.env.MULTIRAG_RUN_JOURNAL,
  'Use a registered isolated fixture',
)
const fixture: Descriptor = JSON.parse(readFileSync(path, 'utf8'))
const mode = process.env.I_WEB_ACCEPTANCE_MODE
assert.ok(mode === 'owner' || mode === 'cleanup')
for (const endpoint of [fixture.origin, fixture.discovery.base_url]) {
  const url = new URL(endpoint)
  assert.equal(url.protocol, 'http:')
  assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname))
}
assert.ok(fixture.scratchDatabase && fixture.instanceName)
const fd = openSync(
  process.env.MULTIRAG_RUN_JOURNAL!,
  constants.O_WRONLY | constants.O_APPEND | (constants.O_NOFOLLOW ?? 0),
)
assert.ok(fstatSync(fd).isFile())
const record = (kind: string, data: object) => {
  writeSync(fd, JSON.stringify({ kind, ...data }) + '\n')
  fsyncSync(fd)
}
const api = createModelProvidersAPI(fixture.origin)
apiClient.setAuthToken(readFileSync(fixture.ownerTokenFile, 'utf8').trim())
const input = {
  api_key: readFileSync(fixture.providerKeyFile, 'utf8').trim(),
  base_url: fixture.discovery.base_url,
  region: fixture.discovery.region,
}
const inventory = async () => {
  const providers = await api.providers()
  return {
    providers,
    instances: providers.some(
      (provider) => provider.name === fixture.providerName,
    )
      ? await api.instances(fixture.providerName)
      : [],
    models: await api.models(),
    defaults: await api.defaults(),
  }
}
try {
  record('reserve-web-discovery-consumer', {
    origin: fixture.origin,
    provider: fixture.providerName,
    instanceName: fixture.instanceName,
    scratchDatabase: fixture.scratchDatabase,
    readbackFile: fixture.readbackFile,
  })
  if (mode === 'cleanup') {
    const prior = JSON.parse(readFileSync(fixture.readbackFile, 'utf8'))
    await api.deleteProvider(fixture.providerName)
    const remaining = await inventory()
    assert.equal(
      remaining.providers.some((item) => item.name === fixture.providerName),
      false,
    )
    assert.equal(
      remaining.models.some(
        (item) => item.provider_name === fixture.providerName,
      ),
      false,
    )
    record('web-discovery-consumer-cleaned', {
      providerName: fixture.providerName,
      modelIds: prior.modelIds,
    })
    console.log(
      JSON.stringify({ mode, status: 'passed', modelIds: prior.modelIds }),
    )
  } else {
    const before = await inventory()
    const page = await api.discoverModels(fixture.providerName, input)
    assert.ok(page.items.length && page.total >= page.items.length)
    assert.ok(
      page.items.every((item) => !('id' in item) && !('status' in item)),
    )
    assert.deepEqual(await inventory(), before)
    if (fixture.invalidBaseURL) {
      await assert.rejects(
        () =>
          api.discoverModels(fixture.providerName, {
            ...input,
            base_url: fixture.invalidBaseURL!,
          }),
        (error: unknown) => error instanceof APIError && error.status === 400,
      )
      assert.deepEqual(await inventory(), before)
    }
    const selected = fixture.modelName
      ? page.items.filter((item) => item.model_name === fixture.modelName)
      : page.items.slice(0, 2)
    assert.ok(selected.length)
    const candidate: ConnectionCandidate = {
      ...input,
      model_ids: [],
      custom_models: selected.map(
        ({ model_name, model_types, max_tokens, is_tools }) => ({
          model_name,
          model_types,
          max_tokens,
          is_tools,
        }),
      ),
    }
    const verified = await api.verifyConnection(fixture.providerName, candidate)
    assert.equal(verified.verified, true)
    assert.ok(selected.some((item) => item.model_name === verified.model_name))
    assert.deepEqual(await inventory(), before)
    await api.createInstance(fixture.providerName, {
      instance_name: fixture.instanceName,
      ...candidate,
    })
    const after = await inventory()
    const models = after.models.filter(
      (model) =>
        model.provider_name === fixture.providerName &&
        model.instance_name === fixture.instanceName,
    )
    assert.equal(models.length, selected.length)
    for (const model of models) {
      const expected = selected.find((item) => item.model_name === model.name)
      assert.ok(expected)
      assert.ok(Number.isSafeInteger(model.id) && model.id > 0)
      assert.equal(model.reference, String(model.id))
      assert.deepEqual(model.model_types, expected.model_types)
      assert.equal(model.max_tokens, expected.max_tokens)
      assert.equal(model.is_tools, expected.is_tools)
    }
    const instance = after.instances.find(
      (item) => item.instance_name === fixture.instanceName,
    )
    assert.ok(instance && !('api_key' in instance))
    const readback = {
      providerName: fixture.providerName,
      instanceName: fixture.instanceName,
      instanceId: instance.id,
      modelIds: models.map((model) => model.id),
      models: models.map((model) => ({
        id: model.id,
        name: model.name,
        types: model.model_types,
        maxTokens: model.max_tokens,
      })),
      hasApiKey: instance.has_api_key,
    }
    writeFileSync(
      fixture.readbackFile,
      JSON.stringify(readback, null, 2) + '\n',
      { flag: 'wx', mode: 0o600 },
    )
    record('web-discovery-consumer-passed', {
      ...readback,
      checks: [
        'discovery-no-write',
        'verification-no-write',
        'atomic-create',
        'numeric-model-readback',
      ],
    })
    console.log(
      JSON.stringify({
        mode,
        status: 'passed',
        modelIds: models.map((model) => model.id),
        instanceId: instance.id,
      }),
    )
  }
} finally {
  apiClient.setAuthToken(null)
  closeSync(fd)
}
