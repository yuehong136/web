import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildPaddleOCRParams,
  isPaddleOCRJobUrl,
  DEFAULT_PADDLEOCR_ALGORITHM,
  PADDLEOCR_ALGORITHMS,
} from '../paddleocr-config'

for (const algorithm of PADDLEOCR_ALGORITHMS) {
  test(`PaddleOCR preserves the ${algorithm} API contract`, () => {
    const endpoint = algorithm === 'PP-OCRv5' ? '/ocr' : '/layout-parsing'
    assert.deepEqual(
      buildPaddleOCRParams({
        modelName: ' model ',
        apiUrl: ` https://service.example${endpoint} `,
        accessToken: ' test-token ',
        algorithm,
      }),
      {
        ok: true,
        params: {
          llm_name: 'model',
          mdl_type: 'ocr',
          max_tokens: 0,
          llm_factory: 'PaddleOCR',
          api_base: '',
          api_key: {
            paddleocr_api_url: `https://service.example${endpoint}`,
            paddleocr_access_token: 'test-token',
            paddleocr_algorithm: algorithm,
          },
        },
      },
    )
  })
}

test('PaddleOCR keeps the existing default and omits an empty optional token', () => {
  assert.equal(DEFAULT_PADDLEOCR_ALGORITHM, 'PaddleOCR-VL')
  const result = buildPaddleOCRParams({
    modelName: 'model',
    apiUrl: 'https://service.example/custom-inference',
    accessToken: ' ',
    algorithm: DEFAULT_PADDLEOCR_ALGORITHM,
  })
  assert.equal(result.ok, true)
  if (result.ok) {
    assert.equal(
      result.params.api_key.paddleocr_api_url,
      'https://service.example/custom-inference',
    )
    assert.equal('paddleocr_access_token' in result.params.api_key, false)
  }
})

test('PaddleOCR blocks incomplete fields and unsupported algorithms', () => {
  const fields = {
    modelName: 'model',
    apiUrl: 'https://service.example/ocr',
    accessToken: '',
    algorithm: 'PP-OCRv5',
  }
  for (const [change, error] of [
    [{ modelName: ' ' }, 'modelNameRequired'],
    [{ apiUrl: ' ' }, 'apiUrlRequired'],
    [{ algorithm: 'OCR' }, 'algorithmUnsupported'],
    [{ algorithm: '' }, 'algorithmUnsupported'],
  ] as const) {
    assert.deepEqual(buildPaddleOCRParams({ ...fields, ...change }), {
      ok: false,
      error,
    })
  }
})

test('PaddleOCR rejects malformed and non-HTTP inference URLs', () => {
  for (const apiUrl of [
    'not-a-url',
    '/ocr',
    'ftp://service.example/ocr',
    'file:///ocr',
    'https://',
  ]) {
    assert.deepEqual(
      buildPaddleOCRParams({
        modelName: 'model',
        apiUrl,
        accessToken: '',
        algorithm: 'PP-OCRv5',
      }),
      { ok: false, error: 'apiUrlInvalid' },
    )
  }
})

test('PaddleOCR preserves the complete cloud Job API URL for every algorithm', () => {
  const apiUrl = 'https://paddleocr.aistudio-app.com/api/v2/ocr/jobs'
  for (const algorithm of PADDLEOCR_ALGORITHMS) {
    const result = buildPaddleOCRParams({
      modelName: 'cloud-model',
      apiUrl,
      accessToken: ' fixture-token ',
      algorithm,
    })
    assert.equal(result.ok, true)
    if (result.ok) {
      assert.equal(result.params.api_key.paddleocr_api_url, apiUrl)
      assert.equal(result.params.api_key.paddleocr_algorithm, algorithm)
      assert.equal(
        result.params.api_key.paddleocr_access_token,
        'fixture-token',
      )
    }
  }
})

test('Job URLs retain gateway prefixes and queries and require a nonblank token', () => {
  const apiUrl = 'https://gateway.example/paddle/api/v2/ocr/jobs?region=cn'
  assert.equal(isPaddleOCRJobUrl(apiUrl), true)
  assert.equal(isPaddleOCRJobUrl(`${apiUrl.split('?')[0]}/?region=cn`), true)
  assert.equal(isPaddleOCRJobUrl('https://service.example/ocr'), false)
  assert.equal(
    isPaddleOCRJobUrl('https://service.example/api/v2/ocr/jobs-preview'),
    false,
  )
  assert.equal(isPaddleOCRJobUrl('not-a-url'), false)
  for (const accessToken of ['', ' ', '\n\t']) {
    assert.deepEqual(
      buildPaddleOCRParams({
        modelName: 'cloud-model',
        apiUrl,
        accessToken,
        algorithm: 'PaddleOCR-VL',
      }),
      { ok: false, error: 'jobTokenRequired' },
    )
  }
  const result = buildPaddleOCRParams({
    modelName: 'cloud-model',
    apiUrl,
    accessToken: 'fixture-token',
    algorithm: 'PaddleOCR-VL',
  })
  assert.equal(result.ok, true)
  if (result.ok) assert.equal(result.params.api_key.paddleocr_api_url, apiUrl)
})
