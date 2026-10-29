import type { MyLLMModel } from '@/stores/model'
import {
  API_KEY_WITH_BASE_URL,
  API_KEY_WITH_CUSTOM_MODEL,
  BEDROCK_REGIONS,
  DEFAULT_BASE_URLS,
  FACTORY_MODEL_TYPES,
  LOCAL_MODEL_FACTORIES,
  TENCENT_CLOUD_MODELS,
} from '../constants'
import {
  getDefaultModelType,
  getEditableModelName,
} from './api-key-modal-utils'
import { DEFAULT_PADDLEOCR_ALGORITHM } from './paddleocr-config'

export interface ProviderDraft {
  apiKey: string
  baseUrl: string
  modelType: string
  modelName: string
  maxTokens: number
  vision: boolean
  isTools: boolean
  groupId: string
  providerOrder: string
  tencentCloudSid: string
  tencentCloudSk: string
  sparkApiPassword: string
  sparkAppId: string
  sparkApiSecret: string
  sparkApiKey: string
  fishAudioAk: string
  fishAudioRefId: string
  googleProjectId: string
  googleRegion: string
  googleServiceAccountKey: string
  azureApiVersion: string
  endpointId: string
  arkApiKey: string
  bedrockAuthMode: string
  bedrockAk: string
  bedrockSk: string
  bedrockRegion: string
  awsRoleArn: string
  mineruApiServer: string
  mineruOutputDir: string
  mineruBackend: string
  mineruServerUrl: string
  mineruDeleteOutput: boolean
  paddleocrApiUrl: string
  paddleocrAccessToken: string
  paddleocrAlgorithm: string
  opendataloaderApiServer: string
  opendataloaderApiKey: string
  opendataloaderTimeout: number
}

type KeysOfType<T> = {
  [K in keyof ProviderDraft]: ProviderDraft[K] extends T ? K : never
}[keyof ProviderDraft]
export type StringField = KeysOfType<string>
export type NumberField = KeysOfType<number>
export type BooleanField = KeysOfType<boolean>
export interface FieldOption {
  value: string
  label: string
  translated?: boolean
}
interface FieldBase {
  label: string
  required?: boolean
  placeholder?: string
  id?: string
}
export type ProviderField = FieldBase &
  (
    | { kind: 'text' | 'secret'; name: StringField }
    | {
        kind: 'select' | 'capabilities'
        name: StringField
        options: FieldOption[]
      }
    | { kind: 'number'; name: NumberField }
    | { kind: 'toggle'; name: BooleanField }
  )

export const isLocalProvider = (provider: string, override?: boolean) =>
  override ?? LOCAL_MODEL_FACTORIES.includes(provider)

export function createProviderDraft(
  provider: string,
  initial?: MyLLMModel,
): ProviderDraft {
  return {
    apiKey: '',
    baseUrl: initial?.api_base ?? DEFAULT_BASE_URLS[provider] ?? '',
    modelType: initial?.model_types?.length
      ? initial.model_types.join(',')
      : initial?.type === 'image2text'
        ? 'chat'
        : (initial?.type ?? getDefaultModelType(provider)),
    modelName: initial
      ? getEditableModelName(initial.name, provider)
      : provider === 'Azure-OpenAI'
        ? 'gpt-3.5-turbo'
        : '',
    maxTokens: initial?.max_tokens ?? 8192,
    vision: initial?.type === 'image2text' && !initial.model_types?.length,
    isTools: initial?.is_tools ?? false,
    groupId: '',
    providerOrder: '',
    tencentCloudSid: '',
    tencentCloudSk: '',
    sparkApiPassword: '',
    sparkAppId: '',
    sparkApiSecret: '',
    sparkApiKey: '',
    fishAudioAk: '',
    fishAudioRefId: '',
    googleProjectId: '',
    googleRegion: '',
    googleServiceAccountKey: '',
    azureApiVersion: '2024-02-01',
    endpointId: '',
    arkApiKey: '',
    bedrockAuthMode: 'access_key_secret',
    bedrockAk: '',
    bedrockSk: '',
    bedrockRegion: '',
    awsRoleArn: '',
    mineruApiServer: '',
    mineruOutputDir: '',
    mineruBackend: 'pipeline',
    mineruServerUrl: '',
    mineruDeleteOutput: true,
    paddleocrApiUrl: '',
    paddleocrAccessToken: '',
    paddleocrAlgorithm: DEFAULT_PADDLEOCR_ALGORITHM,
    opendataloaderApiServer: '',
    opendataloaderApiKey: '',
    opendataloaderTimeout: 600,
  }
}

const text = (
  name: StringField,
  label: string,
  required = true,
  secret = false,
): ProviderField => ({
  name,
  label,
  required,
  kind: secret ? 'secret' : 'text',
})
const tokens: ProviderField = {
  name: 'maxTokens',
  label: 'maxTokens',
  kind: 'number',
  required: true,
}
const modelName = text('modelName', 'modelName')
const key = text('apiKey', 'apiKey', true, true)
const baseUrl = text('baseUrl', 'baseUrl')
const vision: ProviderField = {
  name: 'vision',
  kind: 'toggle',
  label: 'vision',
}
const type = (provider: string): ProviderField => ({
  name: 'modelType',
  label: 'modelType',
  required: true,
  kind: 'capabilities',
  options: (FACTORY_MODEL_TYPES[provider] ?? FACTORY_MODEL_TYPES.Default).map(
    ({ value }) => ({ value, label: value }),
  ),
})
const modelFields = (provider: string): ProviderField[] => [
  type(provider),
  modelName,
]
const special: Record<string, (draft: ProviderDraft) => ProviderField[]> = {
  'Tencent Cloud': () => [
    {
      name: 'modelName',
      label: 'modelName',
      kind: 'select',
      required: true,
      options: TENCENT_CLOUD_MODELS.map(({ value }) => ({
        value,
        label: value,
      })),
    },
    text('tencentCloudSid', 'secretId'),
    text('tencentCloudSk', 'secretKey', true, true),
  ],
  'XunFei Spark': (d) => [
    ...modelFields('XunFei Spark'),
    text('sparkApiPassword', 'apiPassword', true, true),
    ...(d.modelType.split(',').includes('tts')
      ? [
          text('sparkAppId', 'appId'),
          text('sparkApiSecret', 'apiSecret', true, true),
          text('sparkApiKey', 'apiKey', true, true),
        ]
      : []),
    tokens,
  ],
  'Fish Audio': () => [
    modelName,
    text('fishAudioAk', 'apiKey', true, true),
    text('fishAudioRefId', 'referenceId'),
    tokens,
  ],
  'Google Cloud': () => [
    ...modelFields('Google Cloud'),
    text('googleProjectId', 'projectId'),
    text('googleRegion', 'region'),
    text('googleServiceAccountKey', 'serviceAccountKey', true, true),
    tokens,
  ],
  'Azure-OpenAI': (d) => [
    ...modelFields('Azure-OpenAI'),
    baseUrl,
    { ...key, required: false },
    text('azureApiVersion', 'apiVersion', false),
    tokens,
    ...(d.modelType.split(',').includes('chat') ? [vision] : []),
  ],
  VolcEngine: () => [
    ...modelFields('VolcEngine'),
    {
      ...text('endpointId', 'modelId'),
      id: 'volc-model-id',
      placeholder: 'settings.models.volcEngine.modelIdRequired',
    },
    text('arkApiKey', 'arkApiKey', true, true),
    tokens,
  ],
  Bedrock: (d) => [
    ...modelFields('Bedrock'),
    {
      name: 'bedrockAuthMode',
      label: 'authMode',
      kind: 'select',
      required: true,
      options: ['access_key_secret', 'iam_role', 'assume_role'].map(
        (value) => ({
          value,
          label: `settings.models.form.${value}`,
          translated: true,
        }),
      ),
    },
    ...(d.bedrockAuthMode === 'access_key_secret'
      ? [
          text('bedrockAk', 'accessKey'),
          text('bedrockSk', 'secretKey', true, true),
        ]
      : d.bedrockAuthMode === 'iam_role'
        ? [text('awsRoleArn', 'roleArn')]
        : []),
    {
      name: 'bedrockRegion',
      label: 'region',
      kind: 'select',
      required: true,
      options: BEDROCK_REGIONS.map(({ value }) => ({ value, label: value })),
    },
    tokens,
  ],
  MinerU: (d) => [
    modelName,
    text('mineruApiServer', 'apiServer'),
    text('mineruOutputDir', 'outputDir', false),
    {
      name: 'mineruBackend',
      label: 'backend',
      kind: 'select',
      required: true,
      options: [
        'pipeline',
        'vlm-transformers',
        'vlm-vllm-engine',
        'vlm-http-client',
        'vlm-mlx-engine',
        'vlm-vllm-async-engine',
        'vlm-lmdeploy-engine',
      ].map((value) => ({ value, label: value })),
    },
    ...(d.mineruBackend === 'vlm-http-client'
      ? [text('mineruServerUrl', 'serverUrl', false)]
      : []),
    { name: 'mineruDeleteOutput', label: 'deleteOutput', kind: 'toggle' },
  ],
}

export function getProviderFields(
  provider: string,
  draft: ProviderDraft,
  local = isLocalProvider(provider),
): ProviderField[] {
  if (provider === 'PaddleOCR' || provider === 'OpenDataLoader') return []
  if (special[provider]) return special[provider](draft)
  if (local)
    return [
      type(provider),
      modelName,
      baseUrl,
      { ...key, required: false },
      tokens,
      ...(draft.modelType.split(',').includes('chat') ? [vision] : []),
      ...(provider === 'OpenRouter'
        ? [text('providerOrder', 'providerOrder', false)]
        : []),
    ]
  return [
    key,
    ...(API_KEY_WITH_BASE_URL.includes(provider)
      ? [{ ...baseUrl, required: false }]
      : []),
    ...(API_KEY_WITH_CUSTOM_MODEL.includes(provider)
      ? [
          {
            ...modelName,
            required: false,
            placeholder: 'settings.models.form.catalogHint',
          },
          ...(draft.modelName.trim() ? [type(provider), tokens] : []),
        ]
      : []),
    ...(provider === 'MiniMax' ? [text('groupId', 'groupId', false)] : []),
  ]
}

/** Clear hidden secrets at the same boundary that changes their meaning. */
export function changeProviderDraft<K extends keyof ProviderDraft>(
  draft: ProviderDraft,
  name: K,
  value: ProviderDraft[K],
): ProviderDraft {
  const next = { ...draft, [name]: value }
  if (name === 'modelType') {
    next.vision = false
    if (typeof value === 'string' && !value.split(',').includes('tts')) {
      next.sparkAppId = ''
      next.sparkApiSecret = ''
      next.sparkApiKey = ''
    }
  }
  if (name === 'bedrockAuthMode') {
    if (value !== 'access_key_secret') {
      next.bedrockAk = ''
      next.bedrockSk = ''
    }
    if (value !== 'iam_role') next.awsRoleArn = ''
  }
  if (name === 'mineruBackend' && value !== 'vlm-http-client')
    next.mineruServerUrl = ''
  return next
}
