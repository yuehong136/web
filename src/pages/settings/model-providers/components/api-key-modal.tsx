import React, { useState, useEffect } from 'react'
import { Eye, EyeOff, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ProviderIcon } from '@/components/ui/provider-icon'
import { cn } from '@/lib/utils'

// 需要 Base URL 的厂商
const MODELS_WITH_BASE_URL = [
  'OpenAI',
  'Azure-OpenAI', 
  'Tongyi-Qianwen',
  'MiniMax',
  'Anthropic',
  'DeepSeek',
  'Moonshot',
  'ZHIPU-AI'
]

// 本地模型厂商配置
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

// 特殊配置厂商（需要额外参数）
const SPECIAL_CONFIG_FACTORIES = [
  'VolcEngine',
  'Bedrock',
  'Azure-OpenAI',
  'Tencent Hunyuan',
  'Tencent Cloud',
  'XunFei Spark',
  'BaiduYiyan',
  'Fish Audio',
  'Google Cloud'
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
  // 判断是否是本地模型厂商
  const isLocal = isLocalProp ?? LOCAL_MODEL_FACTORIES.includes(providerName)
  const isSpecialConfig = SPECIAL_CONFIG_FACTORIES.includes(providerName)
  const needsBaseUrl = MODELS_WITH_BASE_URL.includes(providerName) || isLocal

  // 表单状态
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [modelType, setModelType] = useState('chat')
  const [modelName, setModelName] = useState('')
  const [maxTokens, setMaxTokens] = useState<number>(8192)
  const [vision, setVision] = useState(false)
  const [groupId, setGroupId] = useState('') // MiniMax 专用
  
  // VolcEngine 特殊字段
  const [endpointId, setEndpointId] = useState('')
  const [arkApiKey, setArkApiKey] = useState('')
  
  // Bedrock 特殊字段
  const [bedrockAk, setBedrockAk] = useState('')
  const [bedrockSk, setBedrockSk] = useState('')
  const [bedrockRegion, setBedrockRegion] = useState('')

  const [showApiKey, setShowApiKey] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const docLink = FACTORY_DOC_LINKS[providerName]
  const modelTypes = FACTORY_MODEL_TYPES[providerName] || FACTORY_MODEL_TYPES['Default']
  const defaultBaseUrl = DEFAULT_BASE_URLS[providerName] || ''

  // 重置表单
  useEffect(() => {
    if (isOpen) {
      setApiKey('')
      setBaseUrl(defaultBaseUrl)
      setModelType('chat')
      setModelName('')
      setMaxTokens(8192)
      setVision(false)
      setGroupId('')
      setEndpointId('')
      setArkApiKey('')
      setBedrockAk('')
      setBedrockSk('')
      setBedrockRegion('')
      setError('')
    }
  }, [isOpen, defaultBaseUrl])

  const handleSave = async () => {
    // 验证必填字段
    if (!isLocal && !isSpecialConfig && !apiKey.trim()) {
      setError('请输入 API Key')
      return
    }

    if (isLocal || isSpecialConfig) {
      if (!modelName.trim()) {
        setError('请输入模型名称')
        return
      }
    }
    
    if (isLocal && !baseUrl.trim()) {
      setError('请输入 Base URL')
      return
    }

    // VolcEngine 特殊验证
    if (providerName === 'VolcEngine') {
      if (!endpointId.trim()) {
        setError('请输入 Endpoint ID')
        return
      }
      if (!arkApiKey.trim()) {
        setError('请输入 ARK API Key')
        return
      }
    }

    // Bedrock 特殊验证
    if (providerName === 'Bedrock') {
      if (!bedrockAk.trim()) {
        setError('请输入 Access Key')
        return
      }
      if (!bedrockSk.trim()) {
        setError('请输入 Secret Key')
        return
      }
      if (!bedrockRegion) {
        setError('请选择区域')
        return
      }
    }

    setIsLoading(true)
    setError('')

    try {
      const additionalParams: Record<string, any> = {}
      
      if (isLocal || isSpecialConfig) {
        // 本地模型和特殊配置模型需要额外参数
        additionalParams.llm_name = modelName
        additionalParams.model_type = vision && modelType === 'chat' ? 'image2text' : modelType
        additionalParams.max_tokens = maxTokens
        additionalParams.llm_factory = providerName
      }

      // VolcEngine 特殊参数
      if (providerName === 'VolcEngine') {
        additionalParams.endpoint_id = endpointId
        additionalParams.ark_api_key = arkApiKey
      }

      // Bedrock 特殊参数
      if (providerName === 'Bedrock') {
        additionalParams.bedrock_ak = bedrockAk
        additionalParams.bedrock_sk = bedrockSk
        additionalParams.bedrock_region = bedrockRegion
      }

      if (providerName === 'MiniMax' && groupId) {
        additionalParams.group_id = groupId
      }

      await onSave(apiKey.trim(), baseUrl.trim() || undefined, additionalParams)
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent 
        title={isLocal ? `添加 ${providerName} 模型` : `设置 ${providerName}`}
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
                {isLocal ? '配置本地模型服务' : '设置 API 密钥'}
              </p>
            </div>
          </div>

          {/* 表单 */}
          <div className="space-y-4">
            {/* 本地模型和特殊配置：模型类型选择 */}
            {(isLocal || isSpecialConfig) && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  模型类型 <span className="text-red-500">*</span>
                </label>
                <Select value={modelType} onValueChange={setModelType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择模型类型" />
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
            )}

            {/* 本地模型和特殊配置：模型名称 */}
            {(isLocal || isSpecialConfig) && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {providerName === 'Xinference' ? '模型 UID' : '模型名称'} <span className="text-red-500">*</span>
                </label>
                <Input
                  value={modelName}
                  onChange={(e) => {
                    setModelName(e.target.value)
                    setError('')
                  }}
                  placeholder={providerName === 'Xinference' ? '请输入模型 UID' : '请输入模型名称'}
                />
              </div>
            )}

            {/* VolcEngine 特殊字段：Endpoint ID */}
            {providerName === 'VolcEngine' && (
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
            )}

            {/* VolcEngine 特殊字段：ARK API Key */}
            {providerName === 'VolcEngine' && (
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
            )}

            {/* Bedrock 特殊字段：Access Key */}
            {providerName === 'Bedrock' && (
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
            )}

            {/* Bedrock 特殊字段：Secret Key */}
            {providerName === 'Bedrock' && (
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
            )}

            {/* Bedrock 特殊字段：Region */}
            {providerName === 'Bedrock' && (
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
            )}

            {/* Base URL */}
            {needsBaseUrl && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Base URL {isLocal && <span className="text-red-500">*</span>}
                  {!isLocal && <span className="text-text-tertiary font-normal ml-1">(可选)</span>}
                </label>
                <Input
                  type="url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder={defaultBaseUrl || 'https://api.example.com/v1'}
                />
                {isLocal && defaultBaseUrl && (
                  <p className="mt-1.5 text-xs text-text-tertiary">
                    默认地址：{defaultBaseUrl}
                  </p>
                )}
              </div>
            )}

            {/* API Key - 不显示给 VolcEngine 和 Bedrock（它们有自己的认证字段） */}
            {providerName !== 'VolcEngine' && providerName !== 'Bedrock' && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                API Key {!isLocal && !isSpecialConfig && <span className="text-red-500">*</span>}
                {(isLocal || isSpecialConfig) && <span className="text-text-tertiary font-normal ml-1">(可选)</span>}
              </label>
              <div className="relative">
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value)
                    setError('')
                  }}
                  placeholder={isLocal ? '如需认证请填写' : '请输入 API Key'}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                >
                  {showApiKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            )}

            {/* 本地模型和特殊配置：Max Tokens */}
            {(isLocal || isSpecialConfig) && (
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
                <p className="mt-1.5 text-xs text-text-tertiary">
                  模型支持的最大 token 数量
                </p>
              </div>
            )}

            {/* OpenRouter: Provider Order */}
            {providerName === 'OpenRouter' && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Provider Order <span className="text-text-tertiary font-normal ml-1">(可选)</span>
                </label>
                <Input
                  value=""
                  onChange={() => {}}
                  placeholder="Groq,Fireworks"
                />
                <p className="mt-1.5 text-xs text-text-tertiary">
                  逗号分隔的提供商列表
                </p>
              </div>
            )}

            {/* MiniMax: Group ID */}
            {providerName === 'MiniMax' && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Group ID
                </label>
                <Input
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  placeholder="请输入 Group ID"
                />
              </div>
            )}

            {/* 本地模型和特殊配置：Vision 开关 */}
            {(isLocal || isSpecialConfig) && modelType === 'chat' && (
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-text-primary">
                  支持视觉 (Vision)
                </label>
                <Switch
                  checked={vision}
                  onCheckedChange={setVision}
                />
              </div>
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
