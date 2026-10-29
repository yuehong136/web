import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildProviderFormCandidate } from '../provider-form-candidate'
import { buildConnectionCandidate } from '../instance-payload'
import {
  changeProviderDraft,
  createProviderDraft,
  isLocalProvider,
} from '../provider-form-schema'

test('provider families keep one normalized candidate, zero limits and credential envelopes', () => {
  const cases = [
    [
      'Tencent Cloud',
      { modelName: '16k_zh', tencentCloudSid: 'id', tencentCloudSk: 'secret' },
      { TencentCloud_sid: 'id', TencentCloud_sk: 'secret' },
      ['speech2text'],
    ],
    [
      'XunFei Spark',
      { modelName: 'spark', sparkApiPassword: 'password' },
      { spark_api_password: 'password' },
      ['chat'],
    ],
    [
      'Fish Audio',
      { modelName: 's1', fishAudioAk: 'key', fishAudioRefId: 'voice-id' },
      { fish_audio_ak: 'key', fish_audio_refid: 'voice-id' },
      ['tts'],
    ],
    [
      'Google Cloud',
      {
        modelName: 'gemini',
        googleProjectId: 'project',
        googleRegion: 'region',
        googleServiceAccountKey: '{"private_key":"synthetic"}',
      },
      {
        google_project_id: 'project',
        google_region: 'region',
        google_service_account_key: '{"private_key":"synthetic"}',
      },
      ['chat'],
    ],
    [
      'Azure-OpenAI',
      {
        modelName: 'deployment',
        baseUrl: 'https://azure.example',
        apiKey: 'key',
        modelType: 'chat',
        vision: true,
      },
      { api_key: 'key', api_version: '2024-02-01' },
      ['chat', 'image2text'],
    ],
    [
      'VolcEngine',
      { modelName: 'model', endpointId: 'endpoint', arkApiKey: 'key' },
      { endpoint_id: 'endpoint', ark_api_key: 'key' },
      ['chat'],
    ],
    [
      'Bedrock',
      {
        modelName: 'model',
        bedrockRegion: 'us-east-1',
        bedrockAuthMode: 'iam_role',
        awsRoleArn: 'arn:fixture',
      },
      {
        auth_mode: 'iam_role',
        bedrock_region: 'us-east-1',
        aws_role_arn: 'arn:fixture',
      },
      ['chat'],
    ],
    [
      'MinerU',
      {
        modelName: 'pipeline',
        mineruApiServer: 'http://127.0.0.1:9987',
        mineruDeleteOutput: false,
      },
      {
        mineru_apiserver: 'http://127.0.0.1:9987',
        mineru_backend: 'pipeline',
        mineru_delete_output: '0',
      },
      ['ocr'],
    ],
    [
      'PaddleOCR',
      {
        modelName: 'ocr',
        paddleocrApiUrl: 'https://paddle.example/ocr',
        paddleocrAlgorithm: 'PP-OCRv5',
      },
      {
        paddleocr_api_url: 'https://paddle.example/ocr',
        paddleocr_algorithm: 'PP-OCRv5',
      },
      ['ocr'],
    ],
    [
      'OpenDataLoader',
      { modelName: 'ocr', opendataloaderApiServer: 'http://127.0.0.1:9383' },
      {
        opendataloader_apiserver: 'http://127.0.0.1:9383',
        opendataloader_timeout: '600',
      },
      ['ocr'],
    ],
  ] as const
  for (const [provider, values, credential, types] of cases) {
    const draft = { ...createProviderDraft(provider), ...values, maxTokens: 0 }
    const result = buildProviderFormCandidate(
      provider,
      draft,
      isLocalProvider(provider),
      true,
    )
    assert.ok(result.ok, provider)
    const candidate = buildConnectionCandidate(
      provider,
      result.apiKey,
      result.baseUrl,
      result.fields,
      '',
    )
    assert.deepEqual(JSON.parse(candidate.api_key), credential, provider)
    assert.deepEqual(candidate.custom_model?.model_types, types, provider)
    assert.equal(
      candidate.custom_model?.max_tokens,
      provider === 'Tencent Cloud' ? 16000 : 0,
    )
    assert.deepEqual(candidate.model_ids, [])
  }
})

test('manual compatible multi-capability models retain zero, tools, names and provider order', () => {
  const draft = {
    ...createProviderDraft('OpenRouter'),
    modelName: ' custom/name ',
    modelType: 'chat,image2text',
    maxTokens: 0,
    isTools: true,
    apiKey: ' key ',
    providerOrder: 'provider-a,provider-b',
  }
  const result = buildProviderFormCandidate('OpenRouter', draft, true, true)
  assert.ok(result.ok)
  const candidate = buildConnectionCandidate(
    'OpenRouter',
    result.apiKey,
    result.baseUrl,
    result.fields,
    '',
  )
  assert.deepEqual(JSON.parse(candidate.api_key), {
    api_key: 'key',
    provider_order: 'provider-a,provider-b',
  })
  assert.deepEqual(candidate.custom_model, {
    model_name: 'custom/name',
    model_types: ['chat', 'image2text'],
    max_tokens: 0,
    is_tools: true,
  })
})

test('changing mode clears hidden credentials and excludes inactive fields', () => {
  let draft = {
    ...createProviderDraft('Bedrock'),
    bedrockAk: 'old',
    bedrockSk: 'old-secret',
    awsRoleArn: 'old-role',
  }
  draft = changeProviderDraft(draft, 'bedrockAuthMode', 'assume_role')
  assert.equal(draft.bedrockAk, '')
  assert.equal(draft.bedrockSk, '')
  assert.equal(draft.awsRoleArn, '')
  const spark = changeProviderDraft(
    {
      ...createProviderDraft('XunFei Spark'),
      modelType: 'tts',
      sparkAppId: 'old',
      sparkApiSecret: 'old',
      sparkApiKey: 'old',
    },
    'modelType',
    'chat',
  )
  assert.equal(spark.sparkAppId + spark.sparkApiSecret + spark.sparkApiKey, '')
  const mineru = changeProviderDraft(
    {
      ...createProviderDraft('MinerU'),
      mineruBackend: 'vlm-http-client',
      mineruServerUrl: 'https://old.example',
    },
    'mineruBackend',
    'pipeline',
  )
  assert.equal(mineru.mineruServerUrl, '')
})

test('invalid and incomplete fields never become candidates; valid defaults preserve explicit zero', () => {
  for (const provider of [
    'Tencent Cloud',
    'XunFei Spark',
    'Fish Audio',
    'Google Cloud',
    'VolcEngine',
    'Bedrock',
    'MinerU',
    'PaddleOCR',
    'OpenDataLoader',
    'Ollama',
    'OpenAI',
  ])
    assert.equal(
      buildProviderFormCandidate(
        provider,
        createProviderDraft(provider),
        isLocalProvider(provider),
        true,
      ).ok,
      false,
      provider,
    )
  const draft = { ...createProviderDraft('Ollama'), modelName: 'model' }
  for (const maxTokens of [NaN, Infinity, -1, 1.5])
    assert.equal(
      buildProviderFormCandidate('Ollama', { ...draft, maxTokens }, true, true)
        .ok,
      false,
    )
  assert.equal(
    createProviderDraft('Ollama', {
      name: 'model',
      type: 'chat',
      used_token: 0,
      max_tokens: 0,
    }).maxTokens,
    0,
  )
  assert.equal(
    buildProviderFormCandidate('Ollama', { ...draft, maxTokens: 0 }, true, true)
      .ok,
    true,
  )
  assert.equal(
    buildProviderFormCandidate(
      'Ollama',
      { ...draft, modelType: '' },
      true,
      true,
    ).ok,
    false,
  )
})

test('special cloud models register all selected capabilities in one atomic candidate', () => {
  for (const provider of ['Google Cloud', 'VolcEngine']) {
    const draft = {
      ...createProviderDraft(provider),
      modelName: 'multi',
      modelType: 'chat,image2text',
      maxTokens: 0,
      googleProjectId: 'project',
      googleRegion: 'region',
      googleServiceAccountKey: 'synthetic',
      endpointId: 'endpoint',
      arkApiKey: 'synthetic',
    }
    const result = buildProviderFormCandidate(provider, draft, false, true)
    assert.ok(result.ok)
    assert.deepEqual(
      buildConnectionCandidate(
        provider,
        result.apiKey,
        result.baseUrl,
        result.fields,
        '',
      ).custom_model?.model_types,
      ['chat', 'image2text'],
    )
  }
  const spark = {
    ...createProviderDraft('XunFei Spark'),
    modelName: 'multi',
    modelType: 'chat,tts',
    sparkApiPassword: 'synthetic',
    sparkAppId: 'app',
    sparkApiSecret: 'secret',
    sparkApiKey: 'key',
  }
  const result = buildProviderFormCandidate('XunFei Spark', spark, false, true)
  assert.ok(result.ok)
  assert.equal(result.fields.spark_app_id, 'app')
  assert.equal(
    changeProviderDraft(spark, 'modelType', 'tts,chat').sparkApiKey,
    'key',
  )
})
