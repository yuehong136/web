import type {
  AddLlmParams,
  ModelVerifyResult,
  MyLLMModel,
} from '@/stores/model'

export interface ApiKeyModalProps {
  isOpen: boolean
  onClose: () => void
  providerName: string
  isLocal?: boolean
  initialValues?: MyLLMModel
  onSave: (
    apiKey: string,
    baseUrl?: string,
    additionalParams?: Record<string, any>,
  ) => Promise<void | ModelVerifyResult>
  onVerify?: (
    apiKey: string,
    baseUrl?: string,
    additionalParams?: Record<string, any>,
  ) => Promise<void | ModelVerifyResult>
}

interface LocalModelParams {
  providerName: string
  modelName: string
  modelType: string
  vision: boolean
  apiKey: string
  baseUrl: string
  maxTokens: number
  isTools: boolean
  includeTools: boolean
}

export const getEditableModelName = (
  name: string,
  providerName: string,
): string => {
  const suffix = (
    {
      LocalAI: '___LocalAI',
      HuggingFace: '___HuggingFace',
      'OpenAI-API-Compatible': '___OpenAI-API',
      VLLM: '___VLLM',
    } as Record<string, string>
  )[providerName]
  return suffix && name.endsWith(suffix) ? name.slice(0, -suffix.length) : name
}

export const buildLocalModelParams = (
  values: LocalModelParams,
): AddLlmParams => {
  const mdlType =
    values.modelType === 'chat' && values.vision
      ? 'image2text'
      : values.modelType
  return {
    llm_factory: values.providerName,
    llm_name: values.modelName.trim(),
    mdl_type: mdlType,
    api_base: values.baseUrl.trim(),
    max_tokens: values.maxTokens,
    ...(values.apiKey.trim() ? { api_key: values.apiKey } : {}),
    ...((mdlType === 'chat' || mdlType === 'image2text') && values.includeTools
      ? { is_tools: values.isTools }
      : {}),
  }
}

interface OpenDataLoaderParamsInput {
  modelName: string
  apiServer: string
  apiKey: string
  timeout: number
}

type OpenDataLoaderParamsResult =
  | { ok: true; params: Record<string, unknown> }
  | { ok: false; error: string }

export const getDefaultModelType = (providerName: string): string => {
  if (providerName === 'Fish Audio') return 'tts'
  if (providerName === 'Tencent Cloud') return 'speech2text'
  if (providerName === 'Azure-OpenAI') return 'embedding'
  if (['MinerU', 'PaddleOCR', 'OpenDataLoader'].includes(providerName)) {
    return 'ocr'
  }
  return 'chat'
}

export const normalizeVerifyResult = (result: unknown): ModelVerifyResult => {
  if (result && typeof result === 'object') {
    const value = result as {
      isValid?: boolean | null
      success?: boolean
      logs?: string
      message?: string
    }
    if (typeof value.isValid === 'boolean' || value.isValid === null) {
      return {
        isValid: value.isValid,
        logs: value.logs || value.message || '',
      }
    }
    if (typeof value.success === 'boolean') {
      return {
        isValid: value.success,
        logs: value.message || value.logs || '',
      }
    }
  }
  return {
    isValid: false,
    logs: '验证失败，未返回可识别的验证结果',
  }
}

export const buildOpenDataLoaderParams = ({
  modelName,
  apiServer,
  apiKey,
  timeout,
}: OpenDataLoaderParamsInput): OpenDataLoaderParamsResult => {
  const normalizedModelName = modelName.trim()
  if (!normalizedModelName) return { ok: false, error: '请输入模型名称' }

  const normalizedApiServer = apiServer.trim()
  if (!normalizedApiServer) {
    return { ok: false, error: '请输入 OpenDataLoader API Server' }
  }

  const config: Record<string, string> = {
    opendataloader_apiserver: normalizedApiServer,
    opendataloader_timeout: String(timeout || 600),
  }
  if (apiKey.trim()) config.opendataloader_api_key = apiKey.trim()

  return {
    ok: true,
    params: {
      llm_name: normalizedModelName,
      mdl_type: 'ocr',
      max_tokens: 0,
      llm_factory: 'OpenDataLoader',
      api_key: config,
      api_base: '',
    },
  }
}
