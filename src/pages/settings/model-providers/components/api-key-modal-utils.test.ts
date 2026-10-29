import {
  buildInstancePayload,
  buildConnectionCandidate,
  saveProviderInstance,
  resolveInstanceRegion,
} from './instance-payload'
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

test('custom model and instance share one atomic request, including retry after rejection', async () => {
  const calls: unknown[] = []
  let fail = true
  const api = {
    createInstance: async (_provider: string, input: unknown) => {
      calls.push(input)
      if (fail) {
        fail = false
        throw Error('controlled rejection')
      }
    },
  }
  const save = (key: string) =>
    saveProviderInstance({
      provider: 'Ollama',
      payload: buildInstancePayload(
        'Ollama',
        'same',
        key,
        '',
        { llm_name: 'custom', mdl_type: 'chat', max_tokens: 0 },
        '',
      ),
      isCurrent: () => true,
      api,
    })
  await assert.rejects(save('synthetic-a'), /controlled rejection/)
  await save('synthetic-b')
  assert.equal(calls.length, 2)
  assert.deepEqual(calls[1], {
    instance_name: 'same',
    api_key: 'synthetic-b',
    base_url: '',
    region: '',
    model_ids: [],
    custom_model: {
      model_name: 'custom',
      model_types: ['chat'],
      max_tokens: 0,
      is_tools: false,
    },
  })
  await assert.rejects(
    saveProviderInstance({
      provider: 'Ollama',
      payload: buildInstancePayload('Ollama', 'same', '', '', {}, ''),
      isCurrent: () => false,
      api,
    }),
    { name: 'AbortError' },
  )
  assert.equal(calls.length, 2)
})

test('SiliconFlow uses raw keys and exact official hosts with explicit supported regions', () => {
  const build = (url: string, region = '', key = 'synthetic') =>
    buildInstancePayload('SILICONFLOW', 'cn', key, url, {}, region).instance
  assert.equal(build('https://api.siliconflow.com/v1').region, 'intl')
  assert.equal(build('https://api.siliconflow.cn/v1').region, 'cn')
  assert.equal(
    build('https://api.siliconflow.com.evil.invalid/v1').region,
    'cn',
  )
  assert.equal(build('https://evil.invalid/api.siliconflow.com').region, 'cn')
  assert.equal(build('https://proxy.invalid', 'intl').region, 'intl')
  assert.equal(build('').api_key, 'synthetic')
  assert.equal(resolveInstanceRegion('OpenAI', 'bad url', 'custom'), 'custom')
  for (const url of [
    'invalid',
    'javascript:alert(1)',
    'https://user:pass@api.siliconflow.com',
  ])
    assert.throws(() => build(url))
  for (const region of ['us', 'INTL']) assert.throws(() => build('', region))
  assert.throws(() => build('https://api.siliconflow.com', 'cn'))
  assert.throws(() => build('https://api.siliconflow.cn', 'intl'))
  assert.throws(() =>
    build('', '', '{"api_key":"synthetic","source_fid":"siliconflow_intl"}'),
  )
})

test('verification candidate omits identity and exactly matches the saved fields', () => {
  const candidate = buildConnectionCandidate(
    'SILICONFLOW',
    'synthetic',
    'https://api.siliconflow.com/v1',
    {},
    '',
  )
  const { instance_name, ...saved } = buildInstancePayload(
    'SILICONFLOW',
    'owned',
    'synthetic',
    'https://api.siliconflow.com/v1',
    {},
    '',
  ).instance
  assert.equal(instance_name, 'owned')
  assert.deepEqual(candidate, saved)
  assert.ok(!('instance_name' in candidate))
  assert.throws(() =>
    buildInstancePayload('SILICONFLOW', '', 'synthetic', '', {}, ''),
  )
})

test('Tongyi region selection uses cn/intl, leaves official endpoint mapping to the server and preserves explicit URLs', () => {
  for (const value of ['', 'default', 'cn', 'intl']) {
    const candidate = buildConnectionCandidate(
      'Tongyi-Qianwen',
      'synthetic',
      undefined,
      {},
      value,
    )
    assert.equal(candidate.base_url, '')
    assert.equal(candidate.region, value === 'intl' ? 'intl' : 'cn')
  }
  assert.equal(
    buildConnectionCandidate(
      'Tongyi-Qianwen',
      'synthetic',
      'https://custom.example/v1',
      {},
      'intl',
    ).base_url,
    'https://custom.example/v1',
  )
  assert.throws(() =>
    buildConnectionCandidate('Tongyi-Qianwen', 'synthetic', '', {}, 'unknown'),
  )
})
