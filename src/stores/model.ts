// LLM 模型相关的纯类型、常量与助手函数。
// 服务器态（my_llms / factories / CRUD）统一走 React Query，见 src/hooks/use-llm-request.ts。

// 根据您提供的数据结构定义类型
export interface MyLLMModel {
  type:
    | 'chat'
    | 'embedding'
    | 'rerank'
    | 'image2text'
    | 'tts'
    | 'speech2text'
    | 'ocr'
  name: string
  used_token: number
  status?: '0' | '1'
  available?: boolean
}

export interface LLMModelAvailability {
  status?: string
  available?: boolean
}

export const isLLMModelEnabled = (
  model?: LLMModelAvailability | null,
): boolean => {
  if (!model) return false
  if (model.available === false) return false
  return model.status !== '0'
}

export interface MyLLMProvider {
  [providerName: string]: {
    tags: string
    llm: MyLLMModel[]
  }
}

export type LLMValueMode = 'name' | 'nameWithProvider'

export interface ParsedLLMValue {
  modelName: string
  providerName: string | null
}

export interface ResolvedLLMValue extends ParsedLLMValue {
  matched: boolean
  value: string
}

export const parseLLMValue = (
  value: string | null | undefined,
): ParsedLLMValue => {
  const trimmedValue = value?.trim() || ''
  if (!trimmedValue) {
    return {
      modelName: '',
      providerName: null,
    }
  }

  const separatorIndex = trimmedValue.lastIndexOf('@')
  if (separatorIndex === -1) {
    return {
      modelName: trimmedValue,
      providerName: null,
    }
  }

  return {
    modelName: trimmedValue.slice(0, separatorIndex),
    providerName: trimmedValue.slice(separatorIndex + 1) || null,
  }
}

export const buildLLMValue = (
  modelName: string,
  providerName: string,
  valueMode: LLMValueMode = 'nameWithProvider',
) => {
  return valueMode === 'nameWithProvider'
    ? `${modelName}@${providerName}`
    : modelName
}

export const resolveLLMValue = (
  providers: MyLLMProvider | null | undefined,
  value: string | null | undefined,
  enabledOnly = false,
): ResolvedLLMValue => {
  const { modelName, providerName } = parseLLMValue(value)
  if (!providers || !modelName) {
    return {
      modelName,
      providerName,
      matched: false,
      value: value?.trim() || '',
    }
  }

  const matchesProvider = (currentProviderName: string, model: MyLLMModel) => {
    if (providerName && currentProviderName !== providerName) {
      return false
    }
    if (model.name !== modelName) {
      return false
    }
    if (enabledOnly && !isLLMModelEnabled(model)) {
      return false
    }
    return true
  }

  for (const [currentProviderName, provider] of Object.entries(providers)) {
    const matchedModel = provider.llm.find((model) =>
      matchesProvider(currentProviderName, model),
    )
    if (matchedModel) {
      return {
        modelName: matchedModel.name,
        providerName: currentProviderName,
        matched: true,
        value: buildLLMValue(matchedModel.name, currentProviderName),
      }
    }
  }

  return {
    modelName,
    providerName,
    matched: false,
    value: value?.trim() || '',
  }
}

export const qualifyLLMValueWithProvider = (
  providers: MyLLMProvider | null | undefined,
  value: string | null | undefined,
  enabledOnly = false,
) => {
  const resolvedValue = resolveLLMValue(providers, value, enabledOnly)
  return resolvedValue.providerName ? resolvedValue.value : value?.trim() || ''
}

export const hasEnabledModelName = (
  providers: MyLLMProvider | null | undefined,
  modelName: string | null | undefined,
): boolean => {
  return resolveLLMValue(providers, modelName, true).matched
}

export const findFirstEnabledModelByType = (
  providers: MyLLMProvider | null | undefined,
  type: MyLLMModel['type'],
  options?: {
    valueMode?: LLMValueMode
  },
): string | null => {
  if (!providers) return null

  const valueMode = options?.valueMode || 'name'

  for (const [providerName, provider] of Object.entries(providers)) {
    const model = provider.llm.find(
      (item) => item.type === type && !!item.name && isLLMModelEnabled(item),
    )
    if (model) return buildLLMValue(model.name, providerName, valueMode)
  }

  return null
}

export const findProviderNameByModelName = (
  providers: MyLLMProvider | null | undefined,
  modelName: string | null | undefined,
  enabledOnly = false,
): string | null => {
  return resolveLLMValue(providers, modelName, enabledOnly).providerName
}

// 添加本地模型的参数
export interface AddLlmParams {
  llm_factory: string
  llm_name: string
  mdl_type: string
  api_base?: string
  api_key?: string | Record<string, any> // 支持字符串或对象（MinerU 等厂商需要传递配置对象）
  max_tokens?: number
  // VolcEngine 特殊字段
  endpoint_id?: string
  ark_api_key?: string
  // Bedrock 特殊字段
  auth_mode?: 'access_key_secret' | 'iam_role' | 'assume_role'
  bedrock_ak?: string
  bedrock_sk?: string
  bedrock_region?: string
  aws_role_arn?: string
  verify?: boolean
  // 其他可扩展字段
  [key: string]: any
}

export interface ModelVerifyResult {
  isValid: boolean | null
  logs: string
}

export const LLMFactory = {
  TongYiQianWen: 'Tongyi-Qianwen',
  Moonshot: 'Moonshot',
  OpenAI: 'OpenAI',
  ZhipuAI: 'ZHIPU-AI',
  WenXinYiYan: '文心一言',
  Ollama: 'Ollama',
  Xinference: 'Xinference',
  ModelScope: 'ModelScope',
  DeepSeek: 'DeepSeek',
  VolcEngine: 'VolcEngine',
  BaiChuan: 'BaiChuan',
  Jina: 'Jina',
  MiniMax: 'MiniMax',
  Mistral: 'Mistral',
  AzureOpenAI: 'Azure-OpenAI',
  Bedrock: 'Bedrock',
  Gemini: 'Gemini',
  Groq: 'Groq',
  OpenRouter: 'OpenRouter',
  LocalAI: 'LocalAI',
  StepFun: 'StepFun',
  NVIDIA: 'NVIDIA',
  LMStudio: 'LM-Studio',
  OpenAiAPICompatible: 'OpenAI-API-Compatible',
  Cohere: 'Cohere',
  LeptonAI: 'LeptonAI',
  TogetherAI: 'TogetherAI',
  PerfXCloud: 'PerfXCloud',
  Upstage: 'Upstage',
  NovitaAI: 'NovitaAI',
  SILICONFLOW: 'SILICONFLOW',
  PPIO: 'PPIO',
  ZeroOneAI: '01.AI',
  Replicate: 'Replicate',
  TencentHunYuan: 'Tencent Hunyuan',
  XunFeiSpark: 'XunFei Spark',
  BaiduYiYan: 'BaiduYiyan',
  FishAudio: 'Fish Audio',
  TencentCloud: 'Tencent Cloud',
  Anthropic: 'Anthropic',
  VoyageAI: 'Voyage AI',
  GoogleCloud: 'Google Cloud',
  HuggingFace: 'HuggingFace',
  YouDao: 'Youdao',
  BAAI: 'BAAI',
  NomicAI: 'nomic-ai',
  JinaAI: 'jinaai',
  SentenceTransformers: 'sentence-transformers',
  GPUStack: 'GPUStack',
  VLLM: 'VLLM',
  GiteeAI: 'GiteeAI',
  // 新增厂商
  XAI: 'xAI',
  Ai302: '302.AI',
  DeepInfra: 'DeepInfra',
  Meituan: 'Meituan',
  Longcat: 'LongCat',
  DeerAPI: 'DeerAPI',
  Grok: 'Grok',
  CometAPI: 'CometAPI',
  JiekouAI: 'Jiekou.AI',
  TokenPony: 'TokenPony',
  Builtin: 'Builtin',
  MinerU: 'MinerU',
  PaddleOCR: 'PaddleOCR',
  OpenDataLoader: 'OpenDataLoader',
  N1n: 'n1n',
  Avian: 'Avian',
  RAGcon: 'RAGcon',
  Perplexity: 'Perplexity',
} as const

// IconMap - 与 ragflow iconfont.js 中的图标名称匹配
export const IconMap: Record<string, string> = {
  [LLMFactory.TongYiQianWen]: 'tongyi-qianwen',
  [LLMFactory.Moonshot]: 'moonshot',
  [LLMFactory.OpenAI]: 'openai',
  [LLMFactory.ZhipuAI]: 'zhipu',
  [LLMFactory.WenXinYiYan]: 'wenxin',
  [LLMFactory.Ollama]: 'ollama',
  [LLMFactory.Xinference]: 'xinference',
  [LLMFactory.ModelScope]: 'modelscope',
  [LLMFactory.DeepSeek]: 'deepseek',
  [LLMFactory.VolcEngine]: 'volcengine',
  [LLMFactory.BaiChuan]: 'baichuan',
  [LLMFactory.Jina]: 'jina',
  [LLMFactory.MiniMax]: 'MiniMax',
  [LLMFactory.Mistral]: 'mistral',
  [LLMFactory.AzureOpenAI]: 'azure',
  [LLMFactory.Bedrock]: 'bedrock',
  [LLMFactory.Gemini]: 'gemini',
  [LLMFactory.Groq]: 'groq-next',
  [LLMFactory.OpenRouter]: 'open-router',
  [LLMFactory.LocalAI]: 'local-ai',
  [LLMFactory.StepFun]: 'stepfun',
  [LLMFactory.NVIDIA]: 'nvidia',
  [LLMFactory.LMStudio]: 'lm-studio',
  [LLMFactory.OpenAiAPICompatible]: 'openai-api',
  [LLMFactory.Cohere]: 'cohere',
  [LLMFactory.LeptonAI]: 'lepton',
  [LLMFactory.TogetherAI]: 'together',
  [LLMFactory.PerfXCloud]: 'perfx-cloud',
  [LLMFactory.Upstage]: 'upstage',
  [LLMFactory.NovitaAI]: 'novita-ai',
  [LLMFactory.SILICONFLOW]: 'siliconflow',
  [LLMFactory.PPIO]: 'ppio',
  [LLMFactory.ZeroOneAI]: 'yi',
  [LLMFactory.Replicate]: 'replicate',
  [LLMFactory.TencentHunYuan]: 'hunyuan',
  [LLMFactory.XunFeiSpark]: 'spark',
  [LLMFactory.BaiduYiYan]: 'wenxinyiyan',
  [LLMFactory.FishAudio]: 'fish-audio',
  [LLMFactory.TencentCloud]: 'tencent-cloud',
  [LLMFactory.Anthropic]: 'anthropic',
  [LLMFactory.VoyageAI]: 'voyage',
  [LLMFactory.GoogleCloud]: 'google-cloud',
  [LLMFactory.HuggingFace]: 'huggingface',
  [LLMFactory.YouDao]: 'youdao',
  [LLMFactory.BAAI]: 'baai',
  [LLMFactory.NomicAI]: 'nomic-ai',
  [LLMFactory.JinaAI]: 'jina',
  [LLMFactory.SentenceTransformers]: 'sentence-transformers',
  [LLMFactory.GPUStack]: 'gpustack',
  [LLMFactory.VLLM]: 'vllm',
  [LLMFactory.GiteeAI]: 'gitee-ai',
  [LLMFactory.XAI]: 'xai',
  [LLMFactory.Ai302]: 'ai302',
  [LLMFactory.DeepInfra]: 'deepinfra',
  [LLMFactory.Meituan]: 'longcat',
  [LLMFactory.Longcat]: 'longcat',
  [LLMFactory.DeerAPI]: 'deerapi',
  [LLMFactory.Grok]: 'grok',
  [LLMFactory.CometAPI]: 'cometapi',
  [LLMFactory.JiekouAI]: 'jiekouai',
  [LLMFactory.TokenPony]: 'tokenpony',
  [LLMFactory.Builtin]: 'builtin',
  [LLMFactory.MinerU]: 'mineru',
  [LLMFactory.PaddleOCR]: 'paddleocr',
  [LLMFactory.N1n]: 'n1n',
  [LLMFactory.Avian]: 'avian',
  [LLMFactory.RAGcon]: 'ragcon',
  [LLMFactory.Perplexity]: 'perplexity',
}

export interface LLMFactoryInterface {
  name: string
  logo: string
  tags: string
  status: string
  id: string
  create_date: string
  update_date: string
  create_time: number
  update_time: number
  model_types: string[]
}
