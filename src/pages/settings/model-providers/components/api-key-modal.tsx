import React, { useState, useEffect } from 'react'
import { Eye, EyeOff, ExternalLink, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ProviderIcon } from '@/components/ui/provider-icon'
import { Segmented, SegmentedItem } from '@/components/vendor/ui/segmented'
import type { ModelVerifyResult } from '@/stores/model'

import {
  API_KEY_WITH_BASE_URL,
  API_KEY_WITH_CUSTOM_MODEL,
  BASE_URL_CONFIG,
  LOCAL_MODEL_FACTORIES,
  SPECIAL_FORM_FACTORIES,
  FACTORY_DOC_LINKS,
  FACTORY_MODEL_TYPES,
  DEFAULT_BASE_URLS,
  BEDROCK_REGIONS,
  TENCENT_CLOUD_MODELS,
} from '../constants'
import type { BedrockAuthMode } from '../constants'

interface ApiKeyModalProps {
  isOpen: boolean
  onClose: () => void
  providerName: string
  isLocal?: boolean
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

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  providerName,
  isLocal: isLocalProp,
  onSave,
  onVerify,
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
  const [bedrockAuthMode, setBedrockAuthMode] =
    useState<BedrockAuthMode>('access_key_secret')
  const [bedrockAk, setBedrockAk] = useState('')
  const [bedrockSk, setBedrockSk] = useState('')
  const [bedrockRegion, setBedrockRegion] = useState('')
  const [awsRoleArn, setAwsRoleArn] = useState('')

  // MinerU 字段
  const [mineruApiServer, setMineruApiServer] = useState('')
  const [mineruOutputDir, setMineruOutputDir] = useState('')
  const [mineruBackend, setMineruBackend] = useState<
    | 'pipeline'
    | 'vlm-transformers'
    | 'vlm-vllm-engine'
    | 'vlm-http-client'
    | 'vlm-mlx-engine'
    | 'vlm-vllm-async-engine'
    | 'vlm-lmdeploy-engine'
  >('pipeline')
  const [mineruServerUrl, setMineruServerUrl] = useState('')
  const [mineruDeleteOutput, setMineruDeleteOutput] = useState(true)
  // PaddleOCR 字段
  const [paddleocrApiUrl, setPaddleocrApiUrl] = useState('')
  const [paddleocrAccessToken, setPaddleocrAccessToken] = useState('')
  const [paddleocrAlgorithm, setPaddleocrAlgorithm] = useState('PaddleOCR-VL')
  // OpenDataLoader fields
  const [opendataloaderApiServer, setOpendataloaderApiServer] = useState('')
  const [opendataloaderApiKey, setOpendataloaderApiKey] = useState('')
  const [opendataloaderTimeout, setOpendataloaderTimeout] = useState(600)

  const [showApiKey, setShowApiKey] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyResult, setVerifyResult] = useState<ModelVerifyResult | null>(
    null,
  )
  const [error, setError] = useState('')

  const docLink = FACTORY_DOC_LINKS[providerName]
  const modelTypes =
    FACTORY_MODEL_TYPES[providerName] || FACTORY_MODEL_TYPES['Default']
  const defaultBaseUrl = DEFAULT_BASE_URLS[providerName] || ''

  // 获取默认模型类型
  const getDefaultModelType = () => {
    if (providerName === 'Fish Audio') return 'tts'
    if (providerName === 'Tencent Cloud') return 'speech2text'
    if (providerName === 'Azure-OpenAI') return 'embedding'
    if (providerName === 'MinerU') return 'ocr'
    if (providerName === 'PaddleOCR') return 'ocr'
    if (providerName === 'OpenDataLoader') return 'ocr'
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
      setBedrockAuthMode('access_key_secret')
      setBedrockAk('')
      setBedrockSk('')
      setBedrockRegion('')
      setAwsRoleArn('')
      // MinerU
      setMineruApiServer('')
      setMineruOutputDir('')
      setMineruBackend('pipeline')
      setMineruServerUrl('')
      setMineruDeleteOutput(true)
      // PaddleOCR
      setPaddleocrApiUrl('')
      setPaddleocrAccessToken('')
      setPaddleocrAlgorithm('PaddleOCR-VL')
      // OpenDataLoader
      setOpendataloaderApiServer('')
      setOpendataloaderApiKey('')
      setOpendataloaderTimeout(600)
      // Verify 状态
      setIsVerifying(false)
      setVerifyResult(null)
      setError('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getDefaultModelType 在组件内，只用于初始化默认值，依赖 isOpen 足矣
  }, [isOpen, defaultBaseUrl, providerName])

  const normalizeVerifyResult = (result: unknown): ModelVerifyResult => {
    if (result && typeof result === 'object') {
      const r = result as {
        isValid?: boolean | null
        success?: boolean
        logs?: string
        message?: string
      }
      if (typeof r.isValid === 'boolean' || r.isValid === null) {
        return {
          isValid: r.isValid,
          logs: r.logs || r.message || '',
        }
      }
      if (typeof r.success === 'boolean') {
        return {
          isValid: r.success,
          logs: r.message || r.logs || '',
        }
      }
    }
    return {
      isValid: false,
      logs: '验证失败，未返回可识别的验证结果',
    }
  }

  const handleSave = async (isVerify = false) => {
    if (isVerify) {
      setVerifyResult({ isValid: null, logs: '' })
      setIsVerifying(true)
    } else {
      setIsLoading(true)
    }
    setError('')

    try {
      const additionalParams: Record<string, any> = {}
      const finalApiKey = apiKey.trim()
      let finalBaseUrl = baseUrl.trim() || undefined

      // ========== 特殊表单厂商验证和参数构建 ==========

      // TencentCloud (腾讯云语音)
      if (providerName === 'Tencent Cloud') {
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
        additionalParams.mdl_type = 'speech2text'
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
        additionalParams.mdl_type = modelType
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
        additionalParams.mdl_type = 'tts'
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
        additionalParams.mdl_type = modelType
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
        additionalParams.mdl_type =
          vision && modelType === 'chat' ? 'image2text' : modelType
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
        additionalParams.mdl_type = modelType
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
        if (!bedrockRegion) {
          setError('请选择区域')
          setIsLoading(false)
          return
        }

        // 根据认证模式验证
        if (bedrockAuthMode === 'access_key_secret') {
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
          additionalParams.bedrock_ak = bedrockAk
          additionalParams.bedrock_sk = bedrockSk
        } else if (bedrockAuthMode === 'iam_role') {
          if (!awsRoleArn.trim()) {
            setError('请输入 AWS Role ARN')
            setIsLoading(false)
            return
          }
          additionalParams.aws_role_arn = awsRoleArn
        }
        // assume_role 模式不需要额外凭证

        additionalParams.auth_mode = bedrockAuthMode
        additionalParams.bedrock_region = bedrockRegion
        additionalParams.llm_name = modelName
        additionalParams.mdl_type = modelType
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
        if (!mineruApiServer.trim()) {
          setError('请输入 API Server 地址')
          setIsLoading(false)
          return
        }
        // 构建 api_key 配置对象
        const mineruConfig: Record<string, any> = {
          mineru_apiserver: mineruApiServer,
          mineru_backend: mineruBackend,
          mineru_delete_output: mineruDeleteOutput ? '1' : '0',
        }
        if (mineruOutputDir.trim()) {
          mineruConfig.mineru_output_dir = mineruOutputDir
        }
        if (mineruServerUrl.trim()) {
          mineruConfig.mineru_server_url = mineruServerUrl
        }

        additionalParams.llm_name = modelName
        additionalParams.mdl_type = 'ocr'
        additionalParams.max_tokens = 0
        additionalParams.llm_factory = providerName
        additionalParams.api_key = mineruConfig
        additionalParams.api_base = ''
      }

      // PaddleOCR
      else if (providerName === 'PaddleOCR') {
        if (!modelName.trim()) {
          setError('请输入模型名称')
          return
        }
        if (!paddleocrApiUrl.trim()) {
          setError('请输入 PaddleOCR API URL')
          return
        }

        const paddleocrConfig: Record<string, any> = {
          paddleocr_api_url: paddleocrApiUrl.trim(),
          paddleocr_algorithm: paddleocrAlgorithm || 'PaddleOCR-VL',
        }
        if (paddleocrAccessToken.trim()) {
          paddleocrConfig.paddleocr_access_token = paddleocrAccessToken.trim()
        }

        additionalParams.llm_name = modelName
        additionalParams.mdl_type = 'ocr'
        additionalParams.max_tokens = 0
        additionalParams.llm_factory = providerName
        additionalParams.api_key = paddleocrConfig
        additionalParams.api_base = ''
      }

      // OpenDataLoader
      else if (providerName === 'OpenDataLoader') {
        if (!modelName.trim()) {
          setError('请输入模型名称')
          return
        }
        if (!opendataloaderApiServer.trim()) {
          setError('请输入 OpenDataLoader API Server')
          return
        }

        const opendataloaderConfig: Record<string, string> = {
          opendataloader_apiserver: opendataloaderApiServer.trim(),
          opendataloader_timeout: String(opendataloaderTimeout || 600),
        }
        if (opendataloaderApiKey.trim()) {
          opendataloaderConfig.opendataloader_api_key =
            opendataloaderApiKey.trim()
        }

        additionalParams.llm_name = modelName
        additionalParams.mdl_type = 'ocr'
        additionalParams.max_tokens = 0
        additionalParams.llm_factory = providerName
        additionalParams.api_key = opendataloaderConfig
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
        additionalParams.mdl_type =
          vision && modelType === 'chat' ? 'image2text' : modelType
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
        // 填了模型名就改走 add_llm，只注册这一个模型（第三方兼容端点的模型名不在官方目录里）
        if (
          API_KEY_WITH_CUSTOM_MODEL.includes(providerName) &&
          modelName.trim()
        ) {
          additionalParams.llm_name = modelName.trim()
          additionalParams.mdl_type = modelType
          additionalParams.max_tokens = maxTokens
          additionalParams.llm_factory = providerName
          if (finalBaseUrl) {
            additionalParams.api_base = finalBaseUrl
          }
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

      if (isVerify) {
        if (!onVerify) {
          setVerifyResult({
            isValid: false,
            logs: '当前供应商不支持验证',
          })
          return
        }
        const verifyResponse = await onVerify(
          finalApiKey,
          finalBaseUrl,
          additionalParams,
        )
        setVerifyResult(normalizeVerifyResult(verifyResponse))
      } else {
        await onSave(finalApiKey, finalBaseUrl, additionalParams)
        handleClose()
      }
    } catch (err: any) {
      if (isVerify) {
        setVerifyResult({
          isValid: false,
          logs: err?.message || '验证失败，请重试',
        })
      } else {
        setError(err?.message || '保存失败，请重试')
      }
    } finally {
      if (isVerify) {
        setIsVerifying(false)
      } else {
        setIsLoading(false)
      }
    }
  }

  const handleClose = () => {
    setApiKey('')
    setBaseUrl('')
    setModelName('')
    setError('')
    setVerifyResult(null)
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
      <DialogContent size="md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-secondary)]">
              <ProviderIcon
                provider={providerName}
                className="h-7 w-7"
                size={28}
              />
            </div>
            <div className="flex-1">
              <DialogTitle>{getModalTitle()}</DialogTitle>
              <DialogDescription>{getModalDescription()}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[calc(90vh-200px)] space-y-4 overflow-y-auto px-6 py-4">
          {/* ========== TencentCloud (腾讯云语音) 专用表单 ========== */}
          {providerName === 'Tencent Cloud' && (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  模型类型
                </label>
                <Input
                  value="speech2text"
                  disabled
                  className="cursor-not-allowed bg-muted"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  模型 <span className="text-red-500">*</span>
                </label>
                <Select value={modelName} onValueChange={setModelName}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择模型" />
                  </SelectTrigger>
                  <SelectContent>
                    {TENCENT_CLOUD_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  腾讯云 SecretId <span className="text-red-500">*</span>
                </label>
                <Input
                  value={tencentCloudSid}
                  onChange={(e) => setTencentCloudSid(e.target.value)}
                  placeholder="请输入 SecretId"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
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
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  模型类型 <span className="text-red-500">*</span>
                </label>
                <Select value={modelType} onValueChange={setModelType}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {modelTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  模型名称 <span className="text-red-500">*</span>
                </label>
                <Input
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="请输入模型名称"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
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
                    <label className="mb-2 block text-sm font-medium text-text-primary">
                      APP ID <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={sparkAppId}
                      onChange={(e) => setSparkAppId(e.target.value)}
                      placeholder="请输入 APP ID"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-text-primary">
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
                    <label className="mb-2 block text-sm font-medium text-text-primary">
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
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  Max Tokens <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  value={maxTokens}
                  onChange={(e) =>
                    setMaxTokens(parseInt(e.target.value) || 8192)
                  }
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
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  模型类型
                </label>
                <Input
                  value="TTS"
                  disabled
                  className="cursor-not-allowed bg-muted"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  模型名称 <span className="text-red-500">*</span>
                </label>
                <Input
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="请输入模型名称"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  API Key <span className="text-red-500">*</span>
                </label>
                <Input
                  value={fishAudioAk}
                  onChange={(e) => setFishAudioAk(e.target.value)}
                  placeholder="请输入 API Key"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  Reference ID <span className="text-red-500">*</span>
                </label>
                <Input
                  value={fishAudioRefId}
                  onChange={(e) => setFishAudioRefId(e.target.value)}
                  placeholder="请输入 Reference ID"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  Max Tokens <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  value={maxTokens}
                  onChange={(e) =>
                    setMaxTokens(parseInt(e.target.value) || 8192)
                  }
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
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  模型类型 <span className="text-red-500">*</span>
                </label>
                <Select value={modelType} onValueChange={setModelType}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {modelTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  模型 ID <span className="text-red-500">*</span>
                </label>
                <Input
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="请输入模型 ID"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  Project ID <span className="text-red-500">*</span>
                </label>
                <Input
                  value={googleProjectId}
                  onChange={(e) => setGoogleProjectId(e.target.value)}
                  placeholder="请输入 Project ID"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  Region <span className="text-red-500">*</span>
                </label>
                <Input
                  value={googleRegion}
                  onChange={(e) => setGoogleRegion(e.target.value)}
                  placeholder="请输入 Region"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
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
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  Max Tokens <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  value={maxTokens}
                  onChange={(e) =>
                    setMaxTokens(parseInt(e.target.value) || 8192)
                  }
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
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  模型类型 <span className="text-red-500">*</span>
                </label>
                <Select value={modelType} onValueChange={setModelType}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {modelTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  Base URL <span className="text-red-500">*</span>
                </label>
                <Input
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://your-resource.openai.azure.com"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  API Key{' '}
                  <span className="ml-1 font-normal text-text-tertiary">
                    (可选)
                  </span>
                </label>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="请输入 API Key"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  模型名称 <span className="text-red-500">*</span>
                </label>
                <Input
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="gpt-3.5-turbo"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  API Version{' '}
                  <span className="ml-1 font-normal text-text-tertiary">
                    (可选)
                  </span>
                </label>
                <Input
                  value={azureApiVersion}
                  onChange={(e) => setAzureApiVersion(e.target.value)}
                  placeholder="2024-02-01"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  Max Tokens <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  value={maxTokens}
                  onChange={(e) =>
                    setMaxTokens(parseInt(e.target.value) || 8192)
                  }
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
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  模型类型 <span className="text-red-500">*</span>
                </label>
                <Select value={modelType} onValueChange={setModelType}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {modelTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  模型名称 <span className="text-red-500">*</span>
                </label>
                <Input
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="请输入模型名称"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  Endpoint ID <span className="text-red-500">*</span>
                </label>
                <Input
                  value={endpointId}
                  onChange={(e) => setEndpointId(e.target.value)}
                  placeholder="请输入 Endpoint ID"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
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
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  Max Tokens <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  value={maxTokens}
                  onChange={(e) =>
                    setMaxTokens(parseInt(e.target.value) || 8192)
                  }
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
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  模型类型 <span className="text-red-500">*</span>
                </label>
                <Select value={modelType} onValueChange={setModelType}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {modelTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  模型名称 <span className="text-red-500">*</span>
                </label>
                <Input
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="请输入模型名称"
                />
              </div>

              {/* AWS 认证模式切换 */}
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  认证模式
                </label>
                <Segmented
                  value={bedrockAuthMode}
                  onValueChange={(v) => {
                    const next = v as BedrockAuthMode
                    setBedrockAuthMode(next)
                    // 切换模式时清除非活动字段
                    if (next !== 'access_key_secret') {
                      setBedrockAk('')
                      setBedrockSk('')
                    }
                    if (next !== 'iam_role') {
                      setAwsRoleArn('')
                    }
                  }}
                  block
                >
                  <SegmentedItem value="access_key_secret">
                    Access Key
                  </SegmentedItem>
                  <SegmentedItem value="iam_role">IAM Role</SegmentedItem>
                  <SegmentedItem value="assume_role">Assume Role</SegmentedItem>
                </Segmented>
              </div>

              {/* Access Key 模式 */}
              {bedrockAuthMode === 'access_key_secret' && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-text-primary">
                      AWS Access Key ID <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={bedrockAk}
                      onChange={(e) => setBedrockAk(e.target.value)}
                      placeholder="请输入 AWS Access Key ID"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-text-primary">
                      AWS Secret Access Key{' '}
                      <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="password"
                      value={bedrockSk}
                      onChange={(e) => setBedrockSk(e.target.value)}
                      placeholder="请输入 AWS Secret Access Key"
                    />
                  </div>
                </>
              )}

              {/* IAM Role 模式 */}
              {bedrockAuthMode === 'iam_role' && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-text-primary">
                    AWS Role ARN <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={awsRoleArn}
                    onChange={(e) => setAwsRoleArn(e.target.value)}
                    placeholder="请输入 AWS Role ARN"
                  />
                </div>
              )}

              {/* Assume Role 模式提示 */}
              {bedrockAuthMode === 'assume_role' && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm text-text-secondary">
                    选择此模式后，EC2 实例将使用其已有的 IAM Role 访问 AWS
                    服务，无需额外的凭证。
                  </p>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  区域 <span className="text-red-500">*</span>
                </label>
                <Select value={bedrockRegion} onValueChange={setBedrockRegion}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择 AWS 区域" />
                  </SelectTrigger>
                  <SelectContent>
                    {BEDROCK_REGIONS.map((region) => (
                      <SelectItem key={region.value} value={region.value}>
                        {region.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  Max Tokens <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  value={maxTokens}
                  onChange={(e) =>
                    setMaxTokens(parseInt(e.target.value) || 8192)
                  }
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
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  模型类型
                </label>
                <Input
                  value="OCR"
                  disabled
                  className="cursor-not-allowed bg-muted"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  模型名称 <span className="text-red-500">*</span>
                </label>
                <Input
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="mineru-from-env-1"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  API Server <span className="text-red-500">*</span>
                </label>
                <Input
                  value={mineruApiServer}
                  onChange={(e) => setMineruApiServer(e.target.value)}
                  placeholder="http://host.docker.internal:9987"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  输出目录{' '}
                  <span className="ml-1 font-normal text-text-tertiary">
                    (可选)
                  </span>
                </label>
                <Input
                  value={mineruOutputDir}
                  onChange={(e) => setMineruOutputDir(e.target.value)}
                  placeholder="/tmp/mineru"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  后端类型 <span className="text-red-500">*</span>
                </label>
                <Select
                  value={mineruBackend}
                  onValueChange={(value) => {
                    setMineruBackend(value as typeof mineruBackend)
                    if (value !== 'vlm-http-client') {
                      setMineruServerUrl('')
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pipeline">Pipeline</SelectItem>
                    <SelectItem value="vlm-transformers">
                      VLM Transformers
                    </SelectItem>
                    <SelectItem value="vlm-vllm-engine">
                      VLM VLLM Engine
                    </SelectItem>
                    <SelectItem value="vlm-http-client">
                      VLM HTTP Client
                    </SelectItem>
                    <SelectItem value="vlm-mlx-engine">
                      VLM MLX Engine
                    </SelectItem>
                    <SelectItem value="vlm-vllm-async-engine">
                      VLM VLLM Async Engine
                    </SelectItem>
                    <SelectItem value="vlm-lmdeploy-engine">
                      VLM LMDeploy Engine
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {mineruBackend === 'vlm-http-client' && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-text-primary">
                    服务器 URL{' '}
                    <span className="ml-1 font-normal text-text-tertiary">
                      (可选)
                    </span>
                  </label>
                  <Input
                    value={mineruServerUrl}
                    onChange={(e) => setMineruServerUrl(e.target.value)}
                    placeholder="http://your-vllm-server:30000"
                  />
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-text-primary">
                    删除输出文件
                  </label>
                  <p className="text-xs text-text-tertiary">
                    处理完成后删除临时输出文件
                  </p>
                </div>
                <Switch
                  checked={mineruDeleteOutput}
                  onCheckedChange={setMineruDeleteOutput}
                />
              </div>
            </>
          )}

          {/* ========== PaddleOCR 专用表单 ========== */}
          {providerName === 'PaddleOCR' && (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  模型类型
                </label>
                <Input
                  value="OCR"
                  disabled
                  className="cursor-not-allowed bg-muted"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  模型名称 <span className="text-red-500">*</span>
                </label>
                <Input
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="paddleocr-from-env-1"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  PaddleOCR API URL <span className="text-red-500">*</span>
                </label>
                <Input
                  value={paddleocrApiUrl}
                  onChange={(e) => setPaddleocrApiUrl(e.target.value)}
                  placeholder="https://paddleocr-server.com/layout-parsing"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  AI Studio 访问令牌{' '}
                  <span className="ml-1 font-normal text-text-tertiary">
                    (可选)
                  </span>
                </label>
                <Input
                  value={paddleocrAccessToken}
                  onChange={(e) => setPaddleocrAccessToken(e.target.value)}
                  placeholder="您的 AI Studio Token（可选）"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  PaddleOCR 算法
                </label>
                <Select
                  value={paddleocrAlgorithm}
                  onValueChange={setPaddleocrAlgorithm}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PaddleOCR-VL">PaddleOCR-VL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* ========== OpenDataLoader 专用表单 ========== */}
          {providerName === 'OpenDataLoader' && (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  模型类型
                </label>
                <Input
                  value="OCR"
                  disabled
                  className="cursor-not-allowed bg-muted"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  模型名称 <span className="text-red-500">*</span>
                </label>
                <Input
                  value={modelName}
                  onChange={(event) => setModelName(event.target.value)}
                  placeholder="opendataloader-from-env-1"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  API Server <span className="text-red-500">*</span>
                </label>
                <Input
                  value={opendataloaderApiServer}
                  onChange={(event) =>
                    setOpendataloaderApiServer(event.target.value)
                  }
                  placeholder="http://host.docker.internal:9383"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  API Key{' '}
                  <span className="ml-1 font-normal text-text-tertiary">
                    (可选)
                  </span>
                </label>
                <Input
                  type="password"
                  value={opendataloaderApiKey}
                  onChange={(event) =>
                    setOpendataloaderApiKey(event.target.value)
                  }
                  placeholder="Bearer token"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  请求超时（秒）
                </label>
                <Input
                  type="number"
                  min={1}
                  value={opendataloaderTimeout}
                  onChange={(event) =>
                    setOpendataloaderTimeout(
                      Number.parseInt(event.target.value, 10) || 600,
                    )
                  }
                />
              </div>
            </>
          )}

          {/* ========== 本地模型厂商表单 ========== */}
          {isLocal && (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  模型类型 <span className="text-red-500">*</span>
                </label>
                <Select value={modelType} onValueChange={setModelType}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {modelTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  {providerName === 'Xinference' ? '模型 UID' : '模型名称'}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <Input
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder={
                    providerName === 'Xinference'
                      ? '请输入模型 UID'
                      : '请输入模型名称'
                  }
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  Base URL <span className="text-red-500">*</span>
                </label>
                <Input
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder={
                    BASE_URL_CONFIG[providerName]?.placeholder ||
                    defaultBaseUrl ||
                    'http://localhost:11434'
                  }
                />
                {BASE_URL_CONFIG[providerName]?.tooltip ? (
                  <p className="mt-1.5 text-xs text-text-tertiary">
                    {BASE_URL_CONFIG[providerName].tooltip}
                  </p>
                ) : (
                  defaultBaseUrl && (
                    <p className="mt-1.5 text-xs text-text-tertiary">
                      默认地址：{defaultBaseUrl}
                    </p>
                  )
                )}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  API Key{' '}
                  <span className="ml-1 font-normal text-text-tertiary">
                    (可选)
                  </span>
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
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  Max Tokens <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  value={maxTokens}
                  onChange={(e) =>
                    setMaxTokens(parseInt(e.target.value) || 8192)
                  }
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
                <label className="mb-2 block text-sm font-medium text-text-primary">
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
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Base URL - 部分厂商支持 */}
              {API_KEY_WITH_BASE_URL.includes(providerName) && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-text-primary">
                    Base URL{' '}
                    <span className="ml-1 font-normal text-text-tertiary">
                      (可选)
                    </span>
                  </label>
                  <Input
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder={
                      BASE_URL_CONFIG[providerName]?.placeholder ||
                      'https://api.example.com/v1'
                    }
                  />
                  {BASE_URL_CONFIG[providerName]?.tooltip && (
                    <p className="mt-1.5 text-xs text-text-tertiary">
                      {BASE_URL_CONFIG[providerName].tooltip}
                    </p>
                  )}
                </div>
              )}

              {/* 自定义模型名 - 用于第三方兼容端点（模型名不在官方目录里） */}
              {API_KEY_WITH_CUSTOM_MODEL.includes(providerName) && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-text-primary">
                      模型名称{' '}
                      <span className="ml-1 font-normal text-text-tertiary">
                        (可选)
                      </span>
                    </label>
                    <Input
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      placeholder="留空则注册该厂商目录里的全部模型"
                    />
                    <p className="mt-1.5 text-xs text-text-tertiary">
                      接第三方兼容端点时填该端点的模型名（如
                      glm-4.6、qwen3-coder-plus），只注册这一个模型
                    </p>
                  </div>
                  {modelName.trim() && (
                    <>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-text-primary">
                          模型类型 <span className="text-red-500">*</span>
                        </label>
                        <Select value={modelType} onValueChange={setModelType}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {modelTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-text-primary">
                          Max Tokens <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="number"
                          value={maxTokens}
                          onChange={(e) =>
                            setMaxTokens(parseInt(e.target.value) || 8192)
                          }
                          placeholder="8192"
                          min={1}
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              {/* MiniMax: Group ID */}
              {providerName === 'MiniMax' && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-text-primary">
                    Group ID{' '}
                    <span className="ml-1 font-normal text-text-tertiary">
                      (可选)
                    </span>
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
            <div className="rounded-xl border border-[var(--color-status-error-border)] bg-[var(--color-status-error-bg)] p-3">
              <p className="text-sm text-[var(--color-status-error)]">
                {error}
              </p>
            </div>
          )}

          {/* 验证结果 */}
          {verifyResult && verifyResult.isValid !== null && (
            <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-secondary)] p-3">
              <p
                className={
                  verifyResult.isValid
                    ? 'text-sm text-[var(--color-status-success)]'
                    : 'text-sm text-[var(--color-status-error)]'
                }
              >
                {verifyResult.isValid ? '验证通过' : '验证失败'}
              </p>
              {verifyResult.logs && (
                <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-xs text-text-secondary">
                  {verifyResult.logs}
                </pre>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {/* 文档链接 */}
            {docLink && (
              <a
                href={docLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-[var(--color-text-accent)] hover:underline"
              >
                如何获取？
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {/* 验证按钮（左侧，ragflow 风格） */}
            {onVerify && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleSave(true)}
                disabled={isLoading || isVerifying}
                className="gap-1.5"
              >
                <RefreshCcw
                  className={
                    isVerifying ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'
                  }
                />
                验证
              </Button>
            )}
          </div>

          {/* 右侧仅保留取消/确定 */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading || isVerifying}
            >
              取消
            </Button>
            <Button
              onClick={() => handleSave(false)}
              disabled={isLoading || isVerifying}
            >
              {isLoading ? '保存中...' : '确定'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
