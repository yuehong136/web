import { buildInstancePayload, saveProviderInstance } from './instance-payload'
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildOpenDataLoaderParams,
  getDefaultModelType,
  normalizeVerifyResult,
} from './api-key-modal-utils'

test('OpenDataLoader uses the OCR model type', () => {
  assert.equal(getDefaultModelType('OpenDataLoader'), 'ocr')
})

test('OpenDataLoader params require a model name and API server', () => {
  assert.deepEqual(
    buildOpenDataLoaderParams({
      modelName: '',
      apiServer: 'http://localhost:9383',
      apiKey: '',
      timeout: 600,
    }),
    { ok: false, error: '请输入模型名称' },
  )
  assert.deepEqual(
    buildOpenDataLoaderParams({
      modelName: 'opendataloader-from-env-1',
      apiServer: ' ',
      apiKey: '',
      timeout: 600,
    }),
    { ok: false, error: '请输入 OpenDataLoader API Server' },
  )
})

test('OpenDataLoader params preserve the backend configuration shape', () => {
  const result = buildOpenDataLoaderParams({
    modelName: ' opendataloader-from-env-1 ',
    apiServer: ' http://localhost:9383 ',
    apiKey: ' token ',
    timeout: 0,
  })

  if (!result.ok) assert.fail(result.error)
  assert.equal(result.ok, true)
  assert.deepEqual(result.params, {
    llm_name: 'opendataloader-from-env-1',
    mdl_type: 'ocr',
    max_tokens: 0,
    llm_factory: 'OpenDataLoader',
    api_key: {
      opendataloader_apiserver: 'http://localhost:9383',
      opendataloader_timeout: '600',
      opendataloader_api_key: 'token',
    },
    api_base: '',
  })
})

test('verification result normalization accepts both supported envelopes', () => {
  assert.deepEqual(normalizeVerifyResult({ isValid: true, logs: 'ready' }), {
    isValid: true,
    logs: 'ready',
  })
  assert.deepEqual(
    normalizeVerifyResult({ success: false, message: 'unreachable' }),
    { isValid: false, logs: 'unreachable' },
  )
})

test('a partial model failure retries the current credential and endpoint before adding the model', async () => {
  const calls: { kind: string; data?: unknown }[] = []
  let first = true,
    created: string | null = null
  const api = {
    createProvider: async () => {
      calls.push({ kind: 'provider' })
    },
    createInstance: async (_provider: string, data: unknown) => {
      calls.push({ kind: 'instance', data })
    },
    updateInstance: async (_provider: string, _name: string, data: unknown) => {
      calls.push({ kind: 'update', data })
    },
    addModel: async () => {
      calls.push({ kind: 'model' })
      if (first) {
        first = false
        throw Error('controlled model failure')
      }
    },
  }
  const save = (key: string, url: string) =>
    saveProviderInstance({
      provider: 'Ollama',
      providerExists: true,
      payload: buildInstancePayload(
        'Ollama',
        'same',
        key,
        url,
        { llm_name: 'model', mdl_type: 'chat', max_tokens: 0 },
        '',
      ),
      createdIdentity: created,
      isCurrent: () => true,
      onCreated: (identity) => {
        created = identity
      },
      api,
    })
  await assert.rejects(save('synthetic-a', 'https://a.invalid'))
  await save('synthetic-b', 'https://b.invalid')
  assert.deepEqual(
    calls.map((call) => call.kind),
    ['instance', 'model', 'update', 'model'],
  )
  assert.deepEqual(calls[2].data, {
    api_key: 'synthetic-b',
    base_url: 'https://b.invalid',
    region: '',
  })
})

test('clearing a custom model after partial instance creation rejects before writes', async () => {
  const calls: string[] = []
  let created: string | null = null
  const api = {
    createProvider: async () => {
      calls.push('provider')
    },
    createInstance: async () => {
      calls.push('instance')
    },
    updateInstance: async () => {
      calls.push('update')
    },
    addModel: async () => {
      calls.push('model')
      throw Error('controlled model failure')
    },
  }
  const save = (model: string) =>
    saveProviderInstance({
      provider: 'Anthropic',
      providerExists: true,
      payload: buildInstancePayload(
        'Anthropic',
        'partial',
        'synthetic-key',
        '',
        model ? { llm_name: model, mdl_type: 'chat', max_tokens: 0 } : {},
        '',
      ),
      createdIdentity: created,
      isCurrent: () => true,
      onCreated: (identity) => {
        created = identity
      },
      api,
    })
  await assert.rejects(save('custom-model'), /controlled model failure/)
  assert.deepEqual(calls, ['instance', 'model'])
  await assert.rejects(save(''), /partial-instance-model-required/)
  assert.deepEqual(calls, ['instance', 'model'])
  assert.equal(created, 'Anthropic\u0000partial')
})
