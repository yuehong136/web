import React, { useState, useEffect } from 'react'
import { Eye, EyeOff, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ProviderIcon } from '@/components/ui/provider-icon'

// ========== 厂商分类 ==========
// 注意：不在 LOCAL_MODEL_FACTORIES 和 SPECIAL_FORM_FACTORIES 中的厂商，
// 默认都会显示 API Key 输入框

// 需要显示 Base URL 选项的普通 API Key 厂商
const API_KEY_WITH_BASE_URL = [
  'OpenAI',
  'Tongyi-Qianwen',
  'MiniMax',
  'Anthropic',
  'BaiduYiyan',
]

// Base URL 提示和占位符
const BASE_URL_CONFIG: Record<string, { placeholder: string; tooltip?: string }> = {
  'OpenAI': { 
    placeholder: 'https://api.openai.com/v1',
    tooltip: '如果使用代理或自定义端点，请填写'
  },
  'Tongyi-Qianwen': { 
    placeholder: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    tooltip: '通义千问 OpenAI 兼容接口地址'
  },
  'MiniMax': { 
    placeholder: 'https://api.minimax.chat/v1',
    tooltip: 'MiniMax API 地址'
  },
  'Anthropic': { 
    placeholder: 'https://api.anthropic.com/v1',
    tooltip: '如果使用代理，请填写'
  },
  'BaiduYiyan': { 
    placeholder: 'https://qianfan.baidubce.com/v2',
    tooltip: '百度文心 OpenAI 兼容接口地址'
  },
}

// 本地模型厂商配置（需要 Base URL、模型名、类型等）
const LOCAL_MODEL_FACTORIES = [
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
  'ModelScope'
]

// 特殊表单厂商（每个都有独特的字段）
const SPECIAL_FORM_FACTORIES = [
  'Tencent Hunyuan',      // 混元：Secret ID + Secret Key
  'Tencent Cloud',        // 腾讯云语音：SecretId + SecretKey + 预设模型
  'XunFei Spark',         // 讯飞星火：API Password + (TTS: AppId, ApiSecret, ApiKey)
  'Fish Audio',           // Fish Audio：AK + RefID
  'Google Cloud',         // Google Cloud：ProjectID + Region + ServiceAccountKey
  'Azure-OpenAI',         // Azure：BaseUrl + ApiKey + ModelName + ApiVersion
  'VolcEngine',           // 火山引擎：EndpointID + ARK API Key
  'Bedrock',              // AWS Bedrock：AK + SK + Region
  'MinerU',               // MinerU：API Server + Output Dir + Backend + Server URL
]

// 厂商文档链接
const FACTORY_DOC_LINKS: Record<string, string> = {
  'Ollama': 'https://github.com/infiniflow/ragflow/blob/main/docs/guides/models/deploy_local_llm.mdx',
  'Xinference': 'https://inference.readthedocs.io/en/latest/user_guide',
  'ModelScope': 'https://www.modelscope.cn/docs/model-service/API-Inference/intro',
  'LocalAI': 'https://localai.io/docs/getting-started/models/',
  'LM-Studio': 'https://lmstudio.ai/docs/basics',
  'OpenAI-API-Compatible': 'https://platform.openai.com/docs/models/gpt-4',
  'TogetherAI': 'https://docs.together.ai/docs/deployment-options',
  'Replicate': 'https://replicate.com/docs/topics/deployments',
  'OpenRouter': 'https://openrouter.ai/docs',
  'HuggingFace': 'https://huggingface.co/docs/text-embeddings-inference/quick_tour',
  'GPUStack': 'https://docs.gpustack.ai/latest/quickstart',
  'VLLM': 'https://docs.vllm.ai/en/latest/',
  'VolcEngine': 'https://www.volcengine.com/docs/82379/1302008',
  'Bedrock': 'https://console.aws.amazon.com/',
  'Azure-OpenAI': 'https://azure.microsoft.com/en-us/products/ai-services/openai-service',
  'Google Cloud': 'https://cloud.google.com/vertex-ai',
  'Fish Audio': 'https://fish.audio',
  'Tencent Cloud': 'https://cloud.tencent.com/document/api/1093/37823',
  'MinerU': 'https://github.com/opendatalab/MinerU',
}

// 各厂商支持的模型类型
const FACTORY_MODEL_TYPES: Record<string, { value: string; label: string }[]> = {
  'HuggingFace': [
    { value: 'embedding', label: 'Embedding' },
    { value: 'chat', label: 'Chat' },
    { value: 'rerank', label: 'Rerank' },
  ],
  'LM-Studio': [
    { value: 'chat', label: 'Chat' },
    { value: 'embedding', label: 'Embedding' },
    { value: 'image2text', label: 'Image2Text' },
  ],
  'Xinference': [
    { value: 'chat', label: 'Chat' },
    { value: 'embedding', label: 'Embedding' },
    { value: 'rerank', label: 'Rerank' },
    { value: 'image2text', label: 'Image2Text' },
    { value: 'speech2text', label: 'Speech2Text' },
    { value: 'tts', label: 'TTS' },
  ],
  'ModelScope': [
    { value: 'chat', label: 'Chat' }
  ],
  'GPUStack': [
    { value: 'chat', label: 'Chat' },
    { value: 'embedding', label: 'Embedding' },
    { value: 'rerank', label: 'Rerank' },
    { value: 'speech2text', label: 'Speech2Text' },
    { value: 'tts', label: 'TTS' },
  ],
  'OpenRouter': [
    { value: 'chat', label: 'Chat' },
    { value: 'image2text', label: 'Image2Text' },
  ],
  'VolcEngine': [
    { value: 'chat', label: 'Chat' },
    { value: 'embedding', label: 'Embedding' },
    { value: 'image2text', label: 'Image2Text' },
  ],
  'Bedrock': [
    { value: 'chat', label: 'Chat' },
    { value: 'embedding', label: 'Embedding' },
  ],
  'XunFei Spark': [
    { value: 'chat', label: 'Chat' },
    { value: 'tts', label: 'TTS' },
  ],
  'BaiduYiyan': [
    { value: 'chat', label: 'Chat' },
    { value: 'embedding', label: 'Embedding' },
    { value: 'rerank', label: 'Rerank' },
  ],
  'Fish Audio': [
    { value: 'tts', label: 'TTS' },
  ],
  'Tencent Cloud': [
    { value: 'speech2text', label: 'Speech2Text' },
  ],
  'Google Cloud': [
    { value: 'chat', label: 'Chat' },
    { value: 'image2text', label: 'Image2Text' },
  ],
  'Azure-OpenAI': [
    { value: 'chat', label: 'Chat' },
    { value: 'embedding', label: 'Embedding' },
    { value: 'image2text', label: 'Image2Text' },
  ],
  'MinerU': [
    { value: 'ocr', label: 'OCR' },
  ],
  'Default': [
    { value: 'chat', label: 'Chat' },
    { value: 'embedding', label: 'Embedding' },
    { value: 'rerank', label: 'Rerank' },
    { value: 'image2text', label: 'Image2Text' },
  ],
}

// 默认 Base URL
const DEFAULT_BASE_URLS: Record<string, string> = {
  'Ollama': 'http://localhost:11434',
  'Xinference': 'http://localhost:9997',
  'LocalAI': 'http://localhost:8080',
  'LM-Studio': 'http://localhost:1234',
  'VLLM': 'http://localhost:8000',
  'GPUStack': 'http://localhost:8000',
}

// Bedrock 区域列表
const BEDROCK_REGIONS = [
  'us-east-1',
  'us-east-2', 
  'us-west-2',
  'ap-south-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
]

// 腾讯云语音模型列表
const TENCENT_CLOUD_MODELS = [
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

interface ApiKeyModalProps {
  isOpen: boolean
  onClose: () => void
  providerName: string
  isLocal?: boolean
  onSave: (apiKey: string, baseUrl?: string, additionalParams?: Record<string, any>) => Promise<void>
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  providerName,
  isLocal: isLocalProp,
  onSave
}) => {
  // 判断厂商类型
  const isLocal = isLocalProp ?? LOCAL_MODEL_FACTORIES.includes(providerName)
  const isSpecialForm = SPECIAL_FORM_FACTORIES.includes(providerName)
  // 默认逻辑：如果不是本地模型，也不是特殊表单，就是普通 API Key 厂商
  const isSimpleApiKey = !isLocal && !isSpecialForm

  // 通用表单状态
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [modelType, setModelType] = useState('chat')
  const [modelName, setModelName] = useState('')
  const [maxTokens, setMaxTokens] = useState<number>(8192)
  const [vision, setVision] = useState(false)
  const [groupId, setGroupId] = useState('') // MiniMax 专用
  
  // Hunyuan (混元) 字段
  const [hunyuanSid, setHunyuanSid] = useState('')
  const [hunyuanSk, setHunyuanSk] = useState('')
  
  // TencentCloud (腾讯云语音) 字段
  const [tencentCloudSid, setTencentCloudSid] = useState('')
  const [tencentCloudSk, setTencentCloudSk] = useState('')
  
  // XunFei Spark (讯飞星火) 字段
  const [sparkApiPassword, setSparkApiPassword] = useState('')
  const [sparkAppId, setSparkAppId] = useState('')
  const [sparkApiSecret, setSparkApiSecret] = useState('')
  const [sparkApiKey, setSparkApiKey] = useState('')
  
  // Fish Audio 字段
  const [fishAudioAk, setFishAudioAk] = useState('')
  const [fishAudioRefId, setFishAudioRefId] = useState('')
  
  // Google Cloud 字段
  const [googleProjectId, setGoogleProjectId] = useState('')
  const [googleRegion, setGoogleRegion] = useState('')
  const [googleServiceAccountKey, setGoogleServiceAccountKey] = useState('')
  
  // Azure OpenAI 字段
  const [azureApiVersion, setAzureApiVersion] = useState('2024-02-01')
  
  // VolcEngine 字段
  const [endpointId, setEndpointId] = useState('')
  const [arkApiKey, setArkApiKey] = useState('')
  
  // Bedrock 字段
  const [bedrockAk, setBedrockAk] = useState('')
  const [bedrockSk, setBedrockSk] = useState('')
  const [bedrockRegion, setBedrockRegion] = useState('')

  // MinerU 字段
  const [mineruApiServer, setMineruApiServer] = useState('')
  const [mineruOutputDir, setMineruOutputDir] = useState('')
  const [mineruBackend, setMineruBackend] = useState<'pipeline' | 'vlm-transformers' | 'vlm-vllm-engine' | 'vlm-http-client'>('pipeline')
  const [mineruServerUrl, setMineruServerUrl] = useState('')
  const [mineruDeleteOutput, setMineruDeleteOutput] = useState(true)

  const [showApiKey, setShowApiKey] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const docLink = FACTORY_DOC_LINKS[providerName]
  const modelTypes = FACTORY_MODEL_TYPES[providerName] || FACTORY_MODEL_TYPES['Default']
  const defaultBaseUrl = DEFAULT_BASE_URLS[providerName] || ''
  
  // 获取默认模型类型
  const getDefaultModelType = () => {
    if (providerName === 'Fish Audio') return 'tts'
    if (providerName === 'Tencent Cloud') return 'speech2text'
    if (providerName === 'Azure-OpenAI') return 'embedding'
    if (providerName === 'MinerU') return 'ocr'
    return 'chat'
  }

  // 重置表单
  useEffect(() => {
    if (isOpen) {
      setApiKey('')
      setBaseUrl(defaultBaseUrl)
      setModelType(getDefaultModelType())
      setModelName(providerName === 'Azure-OpenAI' ? 'gpt-3.5-turbo' : '')
      setMaxTokens(8192)
      setVision(false)
      setGroupId('')
      // Hunyuan
      setHunyuanSid('')
      setHunyuanSk('')
      // TencentCloud
      setTencentCloudSid('')
      setTencentCloudSk('')
      // Spark
      setSparkApiPassword('')
      setSparkAppId('')
      setSparkApiSecret('')
      setSparkApiKey('')
      // Fish Audio
      setFishAudioAk('')
      setFishAudioRefId('')
      // Google Cloud
      setGoogleProjectId('')
      setGoogleRegion('')
      setGoogleServiceAccountKey('')
      // Azure
      setAzureApiVersion('2024-02-01')
      // VolcEngine
      setEndpointId('')
      setArkApiKey('')
      // Bedrock
      setBedrockAk('')
      setBedrockSk('')
      setBedrockRegion('')
      // MinerU
      setMineruApiServer('')
      setMineruOutputDir('')
      setMineruBackend('pipeline')
      setMineruServerUrl('')
      setMineruDeleteOutput(true)
      setError('')
    }
  }, [isOpen, defaultBaseUrl, providerName])

  const handleSave = async () => {
    setIsLoading(true)
    setError('')

    try {
      const additionalParams: Record<string, any> = {}
      let finalApiKey = apiKey.trim()
      let finalBaseUrl = baseUrl.trim() || undefined
      
      // ========== 特殊表单厂商验证和参数构建 ==========
      
      // Hunyuan (混元) - 只需要 SID 和 SK
      if (providerName === 'Tencent Hunyuan') {
        if (!hunyuanSid.trim()) {
          setError('请输入混元 Secret ID')
          setIsLoading(false)
          return
        }
        if (!hunyuanSk.trim()) {
          setError('请输入混元 Secret Key')
          setIsLoading(false)
          return
        }
        additionalParams.hunyuan_sid = hunyuanSid
        additionalParams.hunyuan_sk = hunyuanSk
        additionalParams.llm_factory = providerName
      }
      
      // TencentCloud (腾讯云语音)
      else if (providerName === 'Tencent Cloud') {
        if (!tencentCloudSid.trim()) {
          setError('请输入腾讯云 SecretId')
          setIsLoading(false)
          return
        }
        if (!tencentCloudSk.trim()) {
          setError('请输入腾讯云 SecretKey')
          setIsLoading(false)
          return
        }
        if (!modelName.trim()) {
          setError('请选择模型')
          setIsLoading(false)
          return
        }
        additionalParams.TencentCloud_sid = tencentCloudSid
        additionalParams.TencentCloud_sk = tencentCloudSk
        additionalParams.llm_name = modelName
        additionalParams.model_type = 'speech2text'
        additionalParams.max_tokens = 16000
        additionalParams.llm_factory = providerName
      }
      
      // XunFei Spark (讯飞星火)
      else if (providerName === 'XunFei Spark') {
        if (!modelName.trim()) {
          setError('请输入模型名称')
          setIsLoading(false)
          return
        }
        if (!sparkApiPassword.trim()) {
          setError('请输入 API Password')
          setIsLoading(false)
          return
        }
        // TTS 模式需要额外字段
        if (modelType === 'tts') {
          if (!sparkAppId.trim()) {
            setError('请输入 APP ID')
            setIsLoading(false)
            return
          }
          if (!sparkApiSecret.trim()) {
            setError('请输入 API Secret')
            setIsLoading(false)
            return
          }
          if (!sparkApiKey.trim()) {
            setError('请输入 API Key')
            setIsLoading(false)
            return
          }
          additionalParams.spark_app_id = sparkAppId
          additionalParams.spark_api_secret = sparkApiSecret
          additionalParams.spark_api_key = sparkApiKey
        }
        additionalParams.spark_api_password = sparkApiPassword
        additionalParams.llm_name = modelName
        additionalParams.model_type = modelType
        additionalParams.max_tokens = maxTokens
        additionalParams.llm_factory = providerName
      }
      
      // Fish Audio
      else if (providerName === 'Fish Audio') {
        if (!modelName.trim()) {
          setError('请输入模型名称')
          setIsLoading(false)
          return
        }
        if (!fishAudioAk.trim()) {
          setError('请输入 API Key')
          setIsLoading(false)
          return
        }
        if (!fishAudioRefId.trim()) {
          setError('请输入 Reference ID')
          setIsLoading(false)
          return
        }
        additionalParams.fish_audio_ak = fishAudioAk
        additionalParams.fish_audio_refid = fishAudioRefId
        additionalParams.llm_name = modelName
        additionalParams.model_type = 'tts'
        additionalParams.max_tokens = maxTokens
        additionalParams.llm_factory = providerName
      }
      
      // Google Cloud
      else if (providerName === 'Google Cloud') {
        if (!modelName.trim()) {
          setError('请输入模型 ID')
          setIsLoading(false)
          return
        }
        if (!googleProjectId.trim()) {
          setError('请输入 Project ID')
          setIsLoading(false)
          return
        }
        if (!googleRegion.trim()) {
          setError('请输入 Region')
          setIsLoading(false)
          return
        }
        if (!googleServiceAccountKey.trim()) {
          setError('请输入 Service Account Key')
          setIsLoading(false)
          return
        }
        additionalParams.google_project_id = googleProjectId
        additionalParams.google_region = googleRegion
        additionalParams.google_service_account_key = googleServiceAccountKey
        additionalParams.llm_name = modelName
        additionalParams.model_type = modelType
        additionalParams.max_tokens = maxTokens
        additionalParams.llm_factory = providerName
      }
      
      // Azure OpenAI
      else if (providerName === 'Azure-OpenAI') {
        if (!baseUrl.trim()) {
          setError('请输入 Base URL')
          setIsLoading(false)
          return
        }
        if (!modelName.trim()) {
          setError('请输入模型名称')
          setIsLoading(false)
          return
        }
        additionalParams.api_base = baseUrl
        additionalParams.api_key = apiKey
        additionalParams.api_version = azureApiVersion
        additionalParams.llm_name = modelName
        additionalParams.model_type = vision && modelType === 'chat' ? 'image2text' : modelType
        additionalParams.max_tokens = maxTokens
        additionalParams.llm_factory = providerName
      }
      
      // VolcEngine (火山引擎)
      else if (providerName === 'VolcEngine') {
        if (!modelName.trim()) {
          setError('请输入模型名称')
          setIsLoading(false)
          return
        }
        if (!endpointId.trim()) {
          setError('请输入 Endpoint ID')
          setIsLoading(false)
          return
        }
        if (!arkApiKey.trim()) {
          setError('请输入 ARK API Key')
          setIsLoading(false)
          return
        }
        additionalParams.endpoint_id = endpointId
        additionalParams.ark_api_key = arkApiKey
        additionalParams.llm_name = modelName
        additionalParams.model_type = modelType
        additionalParams.max_tokens = maxTokens
        additionalParams.llm_factory = providerName
      }
      
      // Bedrock
      else if (providerName === 'Bedrock') {
        if (!modelName.trim()) {
          setError('请输入模型名称')
          setIsLoading(false)
          return
        }
        if (!bedrockAk.trim()) {
          setError('请输入 Access Key')
          setIsLoading(false)
          return
        }
        if (!bedrockSk.trim()) {
          setError('请输入 Secret Key')
          setIsLoading(false)
          return
        }
        if (!bedrockRegion) {
          setError('请选择区域')
          setIsLoading(false)
          return
        }
        additionalParams.bedrock_ak = bedrockAk
        additionalParams.bedrock_sk = bedrockSk
        additionalParams.bedrock_region = bedrockRegion
        additionalParams.llm_name = modelName
        additionalParams.model_type = modelType
        additionalParams.max_tokens = maxTokens
        additionalParams.llm_factory = providerName
      }
      
      // MinerU
      else if (providerName === 'MinerU') {
        if (!modelName.trim()) {
          setError('请输入模型名称')
          setIsLoading(false)
          return
        }
        // 构建 api_key 配置对象
        const mineruConfig: Record<string, any> = {
          mineru_backend: mineruBackend,
          mineru_delete_output: mineruDeleteOutput ? '1' : '0',
        }
        if (mineruApiServer.trim()) {
          mineruConfig.mineru_apiserver = mineruApiServer
        }
        if (mineruOutputDir.trim()) {
          mineruConfig.mineru_output_dir = mineruOutputDir
        }
        if (mineruServerUrl.trim()) {
          mineruConfig.mineru_server_url = mineruServerUrl
        }
        
        additionalParams.llm_name = modelName
        additionalParams.model_type = 'ocr'
        additionalParams.max_tokens = 0
        additionalParams.llm_factory = providerName
        additionalParams.api_key = mineruConfig
        additionalParams.api_base = ''
      }
      
      // ========== 本地模型厂商 ==========
      else if (isLocal) {
        if (!modelName.trim()) {
          setError('请输入模型名称')
          setIsLoading(false)
          return
        }
        if (!baseUrl.trim()) {
          setError('请输入 Base URL')
          setIsLoading(false)
          return
        }
        additionalParams.llm_name = modelName
        additionalParams.model_type = vision && modelType === 'chat' ? 'image2text' : modelType
        additionalParams.max_tokens = maxTokens
        additionalParams.llm_factory = providerName
        additionalParams.api_base = baseUrl
        if (apiKey.trim()) {
          additionalParams.api_key = apiKey
        }
      }
      
      // ========== 普通 API Key 厂商 ==========
      else if (isSimpleApiKey) {
        if (!apiKey.trim()) {
          setError('请输入 API Key')
          setIsLoading(false)
          return
        }
        // 传递可选的 Base URL
        if (baseUrl.trim()) {
          finalBaseUrl = baseUrl.trim()
        }
        if (providerName === 'MiniMax' && groupId) {
          additionalParams.group_id = groupId
        }
      }
      
      // ========== 其他厂商（兜底） ==========
      else {
        if (!apiKey.trim()) {
          setError('请输入 API Key')
          setIsLoading(false)
          return
        }
      }

      await onSave(finalApiKey, finalBaseUrl, additionalParams)
      handleClose()
    } catch (err: any) {
      setError(err?.message || '保存失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setApiKey('')
    setBaseUrl('')
    setModelName('')
    setError('')
    setShowApiKey(false)
    onClose()
  }

  if (!isOpen) return null

  // 获取模态框标题
  const getModalTitle = () => {
    if (isLocal) return `添加 ${providerName} 模型`
    if (isSpecialForm) return `添加 ${providerName} LLM`
    return `设置 ${providerName}`
  }

  // 获取模态框描述
  const getModalDescription = () => {
    if (isLocal) return '配置本地模型服务'
    if (isSpecialForm) return '配置模型参数'
    return '设置 API 密钥'
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent 
        title={getModalTitle()}
        className="max-w-lg"
      >
        <div className="space-y-5">
          {/* 头部信息 */}
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="w-12 h-12 rounded-xl bg-accent border border-border flex items-center justify-center overflow-hidden">
              <ProviderIcon provider={providerName} className="w-8 h-8" size={32} />
            </div>

            <div className="flex-1">
              <h3 className="font-semibold text-lg text-text-primary">
                {providerName}
              </h3>
              <p className="text-sm text-text-secondary">
                {getModalDescription()}
              </p>
            </div>
          </div>

          {/* 表单 */}
          <div className="space-y-4">
            {/* ========== Hunyuan (混元) 专用表单 ========== */}
            {providerName === 'Tencent Hunyuan' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    混元 Secret ID <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={hunyuanSid}
                    onChange={(e) => setHunyuanSid(e.target.value)}
                    placeholder="请输入 Secret ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    混元 Secret Key <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="password"
                    value={hunyuanSk}
                    onChange={(e) => setHunyuanSk(e.target.value)}
                    placeholder="请输入 Secret Key"
                  />
                </div>
              </>
            )}

            {/* ========== TencentCloud (腾讯云语音) 专用表单 ========== */}
            {providerName === 'Tencent Cloud' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    模型类型
                  </label>
                  <Input 
                    value="speech2text" 
                    disabled 
                    className="bg-muted cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    模型 <span className="text-red-500">*</span>
                  </label>
                  <Select value={modelName} onValueChange={setModelName}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="选择模型" />
                    </SelectTrigger>
                    <SelectContent>
                      {TENCENT_CLOUD_MODELS.map(model => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    腾讯云 SecretId <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={tencentCloudSid}
                    onChange={(e) => setTencentCloudSid(e.target.value)}
                    placeholder="请输入 SecretId"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    腾讯云 SecretKey <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="password"
                    value={tencentCloudSk}
                    onChange={(e) => setTencentCloudSk(e.target.value)}
                    placeholder="请输入 SecretKey"
                  />
                </div>
              </>
            )}

            {/* ========== XunFei Spark (讯飞星火) 专用表单 ========== */}
            {providerName === 'XunFei Spark' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    模型类型 <span className="text-red-500">*</span>
                  </label>
                  <Select value={modelType} onValueChange={setModelType}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {modelTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    模型名称 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    placeholder="请输入模型名称"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    API Password <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="password"
                    value={sparkApiPassword}
                    onChange={(e) => setSparkApiPassword(e.target.value)}
                    placeholder="请输入 API Password"
                  />
                </div>
                {modelType === 'tts' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        APP ID <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={sparkAppId}
                        onChange={(e) => setSparkAppId(e.target.value)}
                        placeholder="请输入 APP ID"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        API Secret <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="password"
                        value={sparkApiSecret}
                        onChange={(e) => setSparkApiSecret(e.target.value)}
                        placeholder="请输入 API Secret"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        API Key <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="password"
                        value={sparkApiKey}
                        onChange={(e) => setSparkApiKey(e.target.value)}
                        placeholder="请输入 API Key"
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Max Tokens <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value) || 8192)}
                    placeholder="8192"
                    min={1}
                  />
                </div>
              </>
            )}

            {/* ========== Fish Audio 专用表单 ========== */}
            {providerName === 'Fish Audio' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    模型类型
                  </label>
                  <Input 
                    value="TTS" 
                    disabled 
                    className="bg-muted cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    模型名称 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    placeholder="请输入模型名称"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    API Key <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={fishAudioAk}
                    onChange={(e) => setFishAudioAk(e.target.value)}
                    placeholder="请输入 API Key"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Reference ID <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={fishAudioRefId}
                    onChange={(e) => setFishAudioRefId(e.target.value)}
                    placeholder="请输入 Reference ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Max Tokens <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value) || 8192)}
                    placeholder="8192"
                    min={1}
                  />
                </div>
              </>
            )}

            {/* ========== Google Cloud 专用表单 ========== */}
            {providerName === 'Google Cloud' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    模型类型 <span className="text-red-500">*</span>
                  </label>
                  <Select value={modelType} onValueChange={setModelType}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {modelTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    模型 ID <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    placeholder="请输入模型 ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Project ID <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={googleProjectId}
                    onChange={(e) => setGoogleProjectId(e.target.value)}
                    placeholder="请输入 Project ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Region <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={googleRegion}
                    onChange={(e) => setGoogleRegion(e.target.value)}
                    placeholder="请输入 Region"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Service Account Key <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="password"
                    value={googleServiceAccountKey}
                    onChange={(e) => setGoogleServiceAccountKey(e.target.value)}
                    placeholder="请输入 Service Account Key"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Max Tokens <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value) || 8192)}
                    placeholder="8192"
                    min={1}
                  />
                </div>
              </>
            )}

            {/* ========== Azure OpenAI 专用表单 ========== */}
            {providerName === 'Azure-OpenAI' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    模型类型 <span className="text-red-500">*</span>
                  </label>
                  <Select value={modelType} onValueChange={setModelType}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {modelTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Base URL <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://your-resource.openai.azure.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    API Key <span className="text-text-tertiary font-normal ml-1">(可选)</span>
                  </label>
                  <Input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="请输入 API Key"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    模型名称 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    placeholder="gpt-3.5-turbo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    API Version <span className="text-text-tertiary font-normal ml-1">(可选)</span>
                  </label>
                  <Input
                    value={azureApiVersion}
                    onChange={(e) => setAzureApiVersion(e.target.value)}
                    placeholder="2024-02-01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Max Tokens <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value) || 8192)}
                    placeholder="8192"
                    min={1}
                  />
                </div>
                {modelType === 'chat' && (
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-text-primary">
                      支持视觉 (Vision)
                    </label>
                    <Switch checked={vision} onCheckedChange={setVision} />
                  </div>
                )}
              </>
            )}

            {/* ========== VolcEngine (火山引擎) 专用表单 ========== */}
            {providerName === 'VolcEngine' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    模型类型 <span className="text-red-500">*</span>
                  </label>
                  <Select value={modelType} onValueChange={setModelType}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {modelTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    模型名称 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    placeholder="请输入模型名称"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Endpoint ID <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={endpointId}
                    onChange={(e) => setEndpointId(e.target.value)}
                    placeholder="请输入 Endpoint ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    ARK API Key <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="password"
                    value={arkApiKey}
                    onChange={(e) => setArkApiKey(e.target.value)}
                    placeholder="请输入 ARK API Key"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Max Tokens <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value) || 8192)}
                    placeholder="8192"
                    min={1}
                  />
                </div>
              </>
            )}

            {/* ========== Bedrock 专用表单 ========== */}
            {providerName === 'Bedrock' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    模型类型 <span className="text-red-500">*</span>
                  </label>
                  <Select value={modelType} onValueChange={setModelType}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {modelTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    模型名称 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    placeholder="请输入模型名称"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Access Key <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={bedrockAk}
                    onChange={(e) => setBedrockAk(e.target.value)}
                    placeholder="请输入 AWS Access Key"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Secret Key <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="password"
                    value={bedrockSk}
                    onChange={(e) => setBedrockSk(e.target.value)}
                    placeholder="请输入 AWS Secret Key"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    区域 <span className="text-red-500">*</span>
                  </label>
                  <Select value={bedrockRegion} onValueChange={setBedrockRegion}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="选择 AWS 区域" />
                    </SelectTrigger>
                    <SelectContent>
                      {BEDROCK_REGIONS.map(region => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Max Tokens <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value) || 8192)}
                    placeholder="8192"
                    min={1}
                  />
                </div>
              </>
            )}

            {/* ========== MinerU 专用表单 ========== */}
            {providerName === 'MinerU' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    模型类型
                  </label>
                  <Input 
                    value="OCR" 
                    disabled 
                    className="bg-muted cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    模型名称 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    placeholder="mineru-from-env-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    API Server <span className="text-text-tertiary font-normal ml-1">(可选)</span>
                  </label>
                  <Input
                    value={mineruApiServer}
                    onChange={(e) => setMineruApiServer(e.target.value)}
                    placeholder="http://host.docker.internal:9987"
                  />
                  <p className="mt-1.5 text-xs text-text-tertiary">
                    MinerU API 服务器地址
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    输出目录 <span className="text-text-tertiary font-normal ml-1">(可选)</span>
                  </label>
                  <Input
                    value={mineruOutputDir}
                    onChange={(e) => setMineruOutputDir(e.target.value)}
                    placeholder="/tmp/mineru"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    后端类型 <span className="text-red-500">*</span>
                  </label>
                  <Select value={mineruBackend} onValueChange={(value) => setMineruBackend(value as typeof mineruBackend)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pipeline">Pipeline</SelectItem>
                      <SelectItem value="vlm-transformers">VLM Transformers</SelectItem>
                      <SelectItem value="vlm-vllm-engine">VLM VLLM Engine</SelectItem>
                      <SelectItem value="vlm-http-client">VLM HTTP Client</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    服务器 URL <span className="text-text-tertiary font-normal ml-1">(可选)</span>
                  </label>
                  <Input
                    value={mineruServerUrl}
                    onChange={(e) => setMineruServerUrl(e.target.value)}
                    placeholder="http://your-vllm-server:30000"
                  />
                  <p className="mt-1.5 text-xs text-text-tertiary">
                    用于 VLM HTTP Client 后端的服务器地址
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-text-primary">
                      删除输出文件
                    </label>
                    <p className="text-xs text-text-tertiary">
                      处理完成后删除临时输出文件
                    </p>
                  </div>
                  <Switch checked={mineruDeleteOutput} onCheckedChange={setMineruDeleteOutput} />
                </div>
              </>
            )}

            {/* ========== 本地模型厂商表单 ========== */}
            {isLocal && (
              <>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    模型类型 <span className="text-red-500">*</span>
                  </label>
                  <Select value={modelType} onValueChange={setModelType}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {modelTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {providerName === 'Xinference' ? '模型 UID' : '模型名称'} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    placeholder={providerName === 'Xinference' ? '请输入模型 UID' : '请输入模型名称'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Base URL <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder={defaultBaseUrl || 'http://localhost:11434'}
                  />
                  {defaultBaseUrl && (
                    <p className="mt-1.5 text-xs text-text-tertiary">
                      默认地址：{defaultBaseUrl}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    API Key <span className="text-text-tertiary font-normal ml-1">(可选)</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="如需认证请填写"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Max Tokens <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value) || 8192)}
                    placeholder="8192"
                    min={1}
                  />
                </div>
                {modelType === 'chat' && (
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-text-primary">
                      支持视觉 (Vision)
                    </label>
                    <Switch checked={vision} onCheckedChange={setVision} />
                  </div>
                )}
              </>
            )}

            {/* ========== 普通 API Key 厂商表单 ========== */}
            {isSimpleApiKey && !isLocal && !isSpecialForm && (
              <>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    API Key <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => {
                        setApiKey(e.target.value)
                        setError('')
                      }}
                      placeholder="请输入 API Key"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                {/* Base URL - 部分厂商支持 */}
                {API_KEY_WITH_BASE_URL.includes(providerName) && (
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Base URL <span className="text-text-tertiary font-normal ml-1">(可选)</span>
                    </label>
                    <Input
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder={BASE_URL_CONFIG[providerName]?.placeholder || 'https://api.example.com/v1'}
                    />
                    {BASE_URL_CONFIG[providerName]?.tooltip && (
                      <p className="mt-1.5 text-xs text-text-tertiary">
                        {BASE_URL_CONFIG[providerName].tooltip}
                      </p>
                    )}
                  </div>
                )}
                
                {/* MiniMax: Group ID */}
                {providerName === 'MiniMax' && (
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Group ID <span className="text-text-tertiary font-normal ml-1">(可选)</span>
                    </label>
                    <Input
                      value={groupId}
                      onChange={(e) => setGroupId(e.target.value)}
                      placeholder="请输入 Group ID"
                    />
                  </div>
                )}
              </>
            )}

            {/* 错误提示 */}
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            {/* 文档链接 */}
            <div>
              {docLink && (
                <a 
                  href={docLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  如何获取 {providerName}？
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                取消
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="min-w-[80px]"
              >
                {isLoading ? '保存中...' : '确定'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
