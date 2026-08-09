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
