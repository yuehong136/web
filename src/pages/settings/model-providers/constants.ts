/**
 * 模型厂商目录常量 —— 从 components/api-key-modal.tsx 抽出（ENG-1 文件体积棘轮）。
 *
 * 纯静态数据：厂商分类、Base URL 配置与提示、文档链接、模型类型目录、
 * 区域与语音模型枚举。不含任何组件状态或副作用。
 */

// Bedrock 认证模式类型
export type BedrockAuthMode = 'access_key_secret' | 'iam_role' | 'assume_role'

// ========== 厂商分类 ==========
// 注意：不在 LOCAL_MODEL_FACTORIES 和 SPECIAL_FORM_FACTORIES 中的厂商，
// 默认都会显示 API Key 输入框

// 需要显示 Base URL 选项的普通 API Key 厂商
export const API_KEY_WITH_BASE_URL = [
  'OpenAI',
  'Tongyi-Qianwen',
  'MiniMax',
  'Anthropic',
  'BaiduYiyan',
  'SILICONFLOW',
  'Avian',
  'Perplexity',
]

// 普通 API Key 厂商里额外支持「自填模型名」的厂商。
// 填了模型名 → 走 add_llm 只注册这一个模型，用于接第三方兼容端点
// （智谱 https://open.bigmodel.cn/api/anthropic、百炼 https://dashscope.aliyuncs.com/apps/anthropic
//   这类入口用的是自家模型名 glm-*/qwen-*，不在官方目录里）；
// 留空 → 走 set_api_key，一次性注册该厂商目录里的全部模型（官方 claude-* 的原有用法）。
export const API_KEY_WITH_CUSTOM_MODEL = ['Anthropic']

// Base URL 提示和占位符
export const BASE_URL_CONFIG: Record<
  string,
  { placeholder: string; tooltip?: string }
> = {
  OpenAI: {
    placeholder: 'https://api.openai.com/v1',
    tooltip: '如果使用代理或自定义端点，请填写',
  },
  'Tongyi-Qianwen': {
    placeholder: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    tooltip: '通义千问 OpenAI 兼容接口地址',
  },
  MiniMax: {
    placeholder: 'https://api.minimax.chat/v1',
    tooltip: 'MiniMax API 地址',
  },
  Anthropic: {
    // /v1/messages 由后端自动补，这里必须填到「根」，多填 /v1 会拼成 /v1/v1/messages
    placeholder: 'https://api.anthropic.com',
    tooltip:
      '填到根地址即可（不要带 /v1 或 /v1/messages）。接第三方 Anthropic 兼容端点时，填该端点的根并在下方填写它的模型名，例如智谱 https://open.bigmodel.cn/api/anthropic + glm-4.6，阿里百炼 https://dashscope.aliyuncs.com/apps/anthropic',
  },
  'OpenAI-API-Compatible': {
    placeholder: 'https://open.bigmodel.cn/api/paas/v4',
    tooltip:
      '填到版本段为止，不要带 /chat/completions。示例：智谱 https://open.bigmodel.cn/api/paas/v4；阿里百炼 https://dashscope.aliyuncs.com/compatible-mode/v1；vLLM/自建 http://host:8000（缺版本段会自动补 /v1）',
  },
  BaiduYiyan: {
    placeholder: 'https://qianfan.baidubce.com/v2',
    tooltip: '百度文心 OpenAI 兼容接口地址',
  },
  SILICONFLOW: {
    placeholder: 'https://api.siliconflow.cn/v1',
    tooltip:
      '中国用户无需填写或使用 https://api.siliconflow.cn/v1，国际用户使用 https://api.siliconflow.com/v1',
  },
  Avian: {
    placeholder: 'https://api.avian.io/v1',
    tooltip: '默认使用 https://api.avian.io/v1，如使用代理请填写',
  },
  Perplexity: {
    placeholder: 'https://api.perplexity.ai',
    tooltip: '默认使用 https://api.perplexity.ai，如使用代理请填写',
  },
}

// 本地模型厂商配置（需要 Base URL、模型名、类型等）
export const LOCAL_MODEL_FACTORIES = [
  'Ollama',
  'Xinference',
  'LocalAI',
  'LM-Studio',
  'OpenAI-API-Compatible',
  'TogetherAI',
  'Replicate',
  'OpenRouter',
  'HuggingFace',
  'GPUStack',
  'VLLM',
  'ModelScope',
  'RAGcon',
]

// 特殊表单厂商（每个都有独特的字段）
export const SPECIAL_FORM_FACTORIES = [
  'Tencent Cloud', // 腾讯云语音：SecretId + SecretKey + 预设模型
  'XunFei Spark', // 讯飞星火：API Password + (TTS: AppId, ApiSecret, ApiKey)
  'Fish Audio', // Fish Audio：AK + RefID
  'Google Cloud', // Google Cloud：ProjectID + Region + ServiceAccountKey
  'Azure-OpenAI', // Azure：BaseUrl + ApiKey + ModelName + ApiVersion
  'VolcEngine', // 火山引擎：EndpointID + ARK API Key
  'Bedrock', // AWS Bedrock：AK + SK + Region
  'MinerU', // MinerU：API Server + Output Dir + Backend + Server URL
  'PaddleOCR', // PaddleOCR：API URL + Access Token + Algorithm
]

// 厂商文档链接
export const FACTORY_DOC_LINKS: Record<string, string> = {
  Ollama:
    'https://github.com/infiniflow/ragflow/blob/main/docs/guides/models/deploy_local_llm.mdx',
  Xinference: 'https://inference.readthedocs.io/en/latest/user_guide',
  ModelScope:
    'https://www.modelscope.cn/docs/model-service/API-Inference/intro',
  LocalAI: 'https://localai.io/docs/getting-started/models/',
  'LM-Studio': 'https://lmstudio.ai/docs/basics',
  'OpenAI-API-Compatible': 'https://platform.openai.com/docs/models/gpt-4',
  TogetherAI: 'https://docs.together.ai/docs/deployment-options',
  Replicate: 'https://replicate.com/docs/topics/deployments',
  OpenRouter: 'https://openrouter.ai/docs',
  HuggingFace:
    'https://huggingface.co/docs/text-embeddings-inference/quick_tour',
  GPUStack: 'https://docs.gpustack.ai/latest/quickstart',
  VLLM: 'https://docs.vllm.ai/en/latest/',
  VolcEngine: 'https://www.volcengine.com/docs/82379/1302008',
  Bedrock: 'https://console.aws.amazon.com/',
  'Azure-OpenAI':
    'https://azure.microsoft.com/en-us/products/ai-services/openai-service',
  'Google Cloud': 'https://cloud.google.com/vertex-ai',
  'Fish Audio': 'https://fish.audio',
  'Tencent Cloud': 'https://cloud.tencent.com/document/api/1093/37823',
  MinerU: 'https://github.com/opendatalab/MinerU',
  PaddleOCR: 'https://www.paddleocr.ai/latest/',
  RAGcon: 'https://www.ragcon.ai/erste-schritte-mit-ragflow/',
  Avian: 'https://avian.io',
  Perplexity: 'https://docs.perplexity.ai/docs/embeddings/quickstart',
}

// 各厂商支持的模型类型
export const FACTORY_MODEL_TYPES: Record<
  string,
  { value: string; label: string }[]
> = {
  HuggingFace: [
    { value: 'embedding', label: 'Embedding' },
    { value: 'chat', label: 'Chat' },
    { value: 'rerank', label: 'Rerank' },
  ],
  'LM-Studio': [
    { value: 'chat', label: 'Chat' },
    { value: 'embedding', label: 'Embedding' },
    { value: 'image2text', label: 'Image2Text' },
  ],
  Xinference: [
    { value: 'chat', label: 'Chat' },
    { value: 'embedding', label: 'Embedding' },
    { value: 'rerank', label: 'Rerank' },
    { value: 'image2text', label: 'Image2Text' },
    { value: 'speech2text', label: 'Speech2Text' },
    { value: 'tts', label: 'TTS' },
  ],
  ModelScope: [{ value: 'chat', label: 'Chat' }],
  GPUStack: [
    { value: 'chat', label: 'Chat' },
    { value: 'embedding', label: 'Embedding' },
    { value: 'rerank', label: 'Rerank' },
    { value: 'speech2text', label: 'Speech2Text' },
    { value: 'tts', label: 'TTS' },
  ],
  OpenRouter: [
    { value: 'chat', label: 'Chat' },
    { value: 'image2text', label: 'Image2Text' },
  ],
  VolcEngine: [
    { value: 'chat', label: 'Chat' },
    { value: 'embedding', label: 'Embedding' },
    { value: 'image2text', label: 'Image2Text' },
  ],
  Bedrock: [
    { value: 'chat', label: 'Chat' },
    { value: 'embedding', label: 'Embedding' },
  ],
  'XunFei Spark': [
    { value: 'chat', label: 'Chat' },
    { value: 'tts', label: 'TTS' },
  ],
  BaiduYiyan: [
    { value: 'chat', label: 'Chat' },
    { value: 'embedding', label: 'Embedding' },
    { value: 'rerank', label: 'Rerank' },
  ],
  'Fish Audio': [{ value: 'tts', label: 'TTS' }],
  'Tencent Cloud': [{ value: 'speech2text', label: 'Speech2Text' }],
  'Google Cloud': [
    { value: 'chat', label: 'Chat' },
    { value: 'image2text', label: 'Image2Text' },
  ],
  'Azure-OpenAI': [
    { value: 'chat', label: 'Chat' },
    { value: 'embedding', label: 'Embedding' },
    { value: 'image2text', label: 'Image2Text' },
  ],
  Anthropic: [
    { value: 'chat', label: 'Chat' },
    { value: 'image2text', label: 'Image2Text' },
  ],
  MinerU: [{ value: 'ocr', label: 'OCR' }],
  PaddleOCR: [{ value: 'ocr', label: 'OCR' }],
  RAGcon: [
    { value: 'chat', label: 'Chat' },
    { value: 'embedding', label: 'Embedding' },
    { value: 'rerank', label: 'Rerank' },
    { value: 'image2text', label: 'Image2Text' },
    { value: 'speech2text', label: 'Speech2Text' },
    { value: 'tts', label: 'TTS' },
  ],
  Default: [
    { value: 'chat', label: 'Chat' },
    { value: 'embedding', label: 'Embedding' },
    { value: 'rerank', label: 'Rerank' },
    { value: 'image2text', label: 'Image2Text' },
  ],
}

// 默认 Base URL
export const DEFAULT_BASE_URLS: Record<string, string> = {
  Ollama: 'http://localhost:11434',
  Xinference: 'http://localhost:9997',
  LocalAI: 'http://localhost:8080',
  'LM-Studio': 'http://localhost:1234',
  VLLM: 'http://localhost:8000',
  GPUStack: 'http://localhost:8000',
  RAGcon: 'https://connect.ragcon.com/v1',
}

// Bedrock 区域列表（带中文描述）
export const BEDROCK_REGIONS = [
  { value: 'us-east-1', label: '美国东部 (弗吉尼亚北部)' },
  { value: 'us-east-2', label: '美国东部 (俄亥俄州)' },
  { value: 'us-west-2', label: '美国西部 (俄勒冈州)' },
  { value: 'ap-south-1', label: '亚太地区 (孟买)' },
  { value: 'ap-southeast-1', label: '亚太地区 (新加坡)' },
  { value: 'ap-southeast-2', label: '亚太地区 (悉尼)' },
  { value: 'ap-northeast-1', label: '亚太地区 (东京)' },
  { value: 'eu-central-1', label: '欧洲 (法兰克福)' },
  { value: 'eu-west-1', label: '欧洲 (爱尔兰)' },
  { value: 'eu-west-2', label: '欧洲 (伦敦)' },
  { value: 'eu-west-3', label: '欧洲 (巴黎)' },
  { value: 'us-gov-west-1', label: 'AWS GovCloud (US-West)' },
]

// 腾讯云语音模型列表
export const TENCENT_CLOUD_MODELS = [
  { value: '16k_zh', label: '16k_zh (中文普通话)' },
  { value: '16k_zh_large', label: '16k_zh_large (中文普通话-大模型)' },
  { value: '16k_multi_lang', label: '16k_multi_lang (多语种)' },
  { value: '16k_zh_dialect', label: '16k_zh_dialect (中文方言)' },
  { value: '16k_en', label: '16k_en (英语)' },
  { value: '16k_yue', label: '16k_yue (粤语)' },
  { value: '16k_zh-PY', label: '16k_zh-PY (中英混合)' },
  { value: '16k_ja', label: '16k_ja (日语)' },
  { value: '16k_ko', label: '16k_ko (韩语)' },
]
