import { API_KEY_WITH_CUSTOM_MODEL } from '../constants'
import {
  buildLocalModelParams,
  buildModelTypesWithVision,
  buildOpenDataLoaderParams,
} from './api-key-modal-utils'
import { buildPaddleOCRParams } from './paddleocr-config'
import { getProviderFields, type ProviderDraft } from './provider-form-schema'

export type ProviderFormResult =
  | {
      ok: true
      apiKey: string
      baseUrl?: string
      fields: Record<string, unknown>
    }
  | { ok: false; error: string; field?: string }

/** Both verification and creation consume this one immutable draft snapshot. */
export function buildProviderFormCandidate(
  provider: string,
  d: ProviderDraft,
  local: boolean,
  includeTools: boolean,
): ProviderFormResult {
  for (const field of getProviderFields(provider, d, local)) {
    const value = d[field.name]
    if (field.required && typeof value === 'string' && !value.trim())
      return {
        ok: false,
        error:
          field.name === 'endpointId'
            ? 'settings.models.volcEngine.modelIdRequired'
            : 'settings.models.form.required',
        field: field.label,
      }
    if (
      (field.kind === 'select' || field.kind === 'capabilities') &&
      typeof value === 'string'
    ) {
      const selected =
        field.kind === 'capabilities' ? value.split(',') : [value]
      if (
        selected.some(
          (item) => !field.options.some((option) => option.value === item),
        )
      )
        return {
          ok: false,
          error: 'settings.models.form.required',
          field: field.label,
        }
    }
    if (
      field.kind === 'number' &&
      (!Number.isSafeInteger(value) || Number(value) < 0)
    )
      return {
        ok: false,
        error: 'settings.models.form.invalidNumber',
        field: field.label,
      }
  }
  const fields: Record<string, unknown> = {}
  const model = (type = d.modelType, maxTokens = d.maxTokens) =>
    Object.assign(fields, {
      llm_factory: provider,
      llm_name: d.modelName.trim(),
      mdl_type: type,
      max_tokens: maxTokens,
    })
  switch (provider) {
    case 'Tencent Cloud':
      model('speech2text', 16000)
      Object.assign(fields, {
        TencentCloud_sid: d.tencentCloudSid.trim(),
        TencentCloud_sk: d.tencentCloudSk.trim(),
      })
      break
    case 'XunFei Spark':
      model()
      fields.spark_api_password = d.sparkApiPassword.trim()
      if (d.modelType.split(',').includes('tts'))
        Object.assign(fields, {
          spark_app_id: d.sparkAppId.trim(),
          spark_api_secret: d.sparkApiSecret.trim(),
          spark_api_key: d.sparkApiKey.trim(),
        })
      break
    case 'Fish Audio':
      model('tts')
      Object.assign(fields, {
        fish_audio_ak: d.fishAudioAk.trim(),
        fish_audio_refid: d.fishAudioRefId.trim(),
      })
      break
    case 'Google Cloud':
      model()
      Object.assign(fields, {
        google_project_id: d.googleProjectId.trim(),
        google_region: d.googleRegion.trim(),
        google_service_account_key: d.googleServiceAccountKey.trim(),
      })
      break
    case 'Azure-OpenAI':
      model(buildModelTypesWithVision(d.modelType, d.vision).join(','))
      Object.assign(fields, {
        api_base: d.baseUrl.trim(),
        api_key: d.apiKey.trim(),
        api_version: d.azureApiVersion.trim(),
      })
      break
    case 'VolcEngine':
      model()
      Object.assign(fields, {
        endpoint_id: d.endpointId.trim(),
        api_key: d.apiKey.trim(),
      })
      break
    case 'Bedrock':
      model()
      Object.assign(fields, {
        auth_mode: d.bedrockAuthMode,
        bedrock_region: d.bedrockRegion,
      })
      if (d.bedrockAuthMode === 'access_key_secret')
        Object.assign(fields, {
          bedrock_ak: d.bedrockAk.trim(),
          bedrock_sk: d.bedrockSk.trim(),
        })
      else if (d.bedrockAuthMode === 'iam_role')
        fields.aws_role_arn = d.awsRoleArn.trim()
      break
    case 'MinerU':
      model('ocr', 0)
      Object.assign(fields, {
        api_base: '',
        api_key: {
          mineru_apiserver: d.mineruApiServer.trim(),
          mineru_backend: d.mineruBackend,
          mineru_delete_output: d.mineruDeleteOutput ? '1' : '0',
          ...(d.mineruOutputDir.trim()
            ? { mineru_output_dir: d.mineruOutputDir.trim() }
            : {}),
          ...(d.mineruBackend === 'vlm-http-client' && d.mineruServerUrl.trim()
            ? { mineru_server_url: d.mineruServerUrl.trim() }
            : {}),
        },
      })
      break
    case 'PaddleOCR': {
      const result = buildPaddleOCRParams({
        modelName: d.modelName,
        apiUrl: d.paddleocrApiUrl,
        accessToken: d.paddleocrAccessToken,
        algorithm: d.paddleocrAlgorithm,
      })
      if (!result.ok)
        return { ok: false, error: `settings.models.paddleOCR.${result.error}` }
      Object.assign(fields, result.params)
      break
    }
    case 'OpenDataLoader': {
      if (
        !Number.isSafeInteger(d.opendataloaderTimeout) ||
        d.opendataloaderTimeout <= 0
      )
        return {
          ok: false,
          error: 'settings.models.form.invalidNumber',
          field: 'timeout',
        }
      const result = buildOpenDataLoaderParams({
        modelName: d.modelName,
        apiServer: d.opendataloaderApiServer,
        apiKey: d.opendataloaderApiKey,
        timeout: d.opendataloaderTimeout,
      })
      if (!result.ok)
        return {
          ok: false,
          error: 'settings.models.form.required',
          field: !d.modelName.trim() ? 'modelName' : 'apiServer',
        }
      Object.assign(fields, result.params)
      break
    }
    default:
      if (local)
        Object.assign(
          fields,
          buildLocalModelParams({ providerName: provider, ...d, includeTools }),
        )
      else {
        if (
          API_KEY_WITH_CUSTOM_MODEL.includes(provider) &&
          d.modelName.trim()
        ) {
          model()
          if (d.baseUrl.trim()) fields.api_base = d.baseUrl.trim()
        }
        if (provider === 'MiniMax' && d.groupId.trim())
          fields.group_id = d.groupId.trim()
      }
  }
  if (provider === 'OpenRouter' && d.providerOrder.trim())
    fields.provider_order = d.providerOrder.trim()
  return {
    ok: true,
    apiKey: d.apiKey.trim(),
    baseUrl: d.baseUrl.trim() || undefined,
    fields,
  }
}
