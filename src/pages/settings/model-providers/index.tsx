import React, { useCallback } from 'react'
import { type AddLlmParams, type ModelVerifyResult } from '@/stores/model'
import {
  useFetchMyLLMs,
  useSetApiKey,
  useAddLLM,
  useEnableLLM,
  useDeleteFactory,
} from '@/hooks/use-llm-request'
import { Loading } from '@/components/ui/loading'
import { SystemSetting } from './components/system-setting'
import { UsedModels } from './components/used-models'
import { AvailableModels } from './components/available-models'
import { ApiKeyModal } from './components/api-key-modal'

// 本地模型厂商列表
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
  'ModelScope',
]

// 特殊配置厂商（需要使用 add_llm 接口）
const SPECIAL_CONFIG_FACTORIES = [
  'VolcEngine',
  'Bedrock',
  'Azure-OpenAI',
  'Tencent Cloud',
  'XunFei Spark',
  'BaiduYiyan',
  'Fish Audio',
  'Google Cloud',
  'MinerU',
  'PaddleOCR',
]

export const ModelProvidersPage: React.FC = () => {
  const { myLLMs, isLoading } = useFetchMyLLMs()
  const { setApiKey } = useSetApiKey()
  const { addLLM } = useAddLLM()
  const { enableLlm } = useEnableLLM()
  const { deleteFactory } = useDeleteFactory()

  const [apiKeyModal, setApiKeyModal] = React.useState<{
    isOpen: boolean
    providerName: string
    isLocal?: boolean
  }>({
    isOpen: false,
    providerName: '',
    isLocal: false,
  })

  // 处理添加模型
  const handleAddModel = useCallback((factoryName: string) => {
    const isLocal = LOCAL_MODEL_FACTORIES.includes(factoryName)

    setApiKeyModal({
      isOpen: true,
      providerName: factoryName,
      isLocal,
    })
  }, [])

  // 处理保存 - 根据厂商类型调用不同的 API
  const handleSaveApiKey = async (
    apiKey: string,
    baseUrl?: string,
    additionalParams?: Record<string, any>,
    verify = false,
  ): Promise<void | ModelVerifyResult> => {
    const isLocal = LOCAL_MODEL_FACTORIES.includes(apiKeyModal.providerName)
    const isSpecialConfig = SPECIAL_CONFIG_FACTORIES.includes(
      apiKeyModal.providerName,
    )

    // 特殊配置厂商和本地模型使用 add_llm 接口
    const needsAddLlm = isLocal || isSpecialConfig
    const hasRequiredParams = additionalParams?.llm_name

    if (needsAddLlm && hasRequiredParams) {
      // 本地模型和特殊配置厂商使用 add_llm 接口
      const params: AddLlmParams = {
        llm_factory: additionalParams?.llm_factory || apiKeyModal.providerName,
        llm_name: additionalParams.llm_name || apiKeyModal.providerName,
        mdl_type: additionalParams.mdl_type || 'chat',
        api_base: baseUrl || additionalParams?.api_base,
        api_key: apiKey || additionalParams?.api_key || undefined,
        max_tokens: additionalParams.max_tokens,
        // 传递所有特殊参数
        ...additionalParams,
      }
      return addLLM(params, verify)
    } else {
      // 普通云服务厂商使用 set_api_key 接口
      return setApiKey(
        apiKeyModal.providerName,
        apiKey,
        baseUrl,
        additionalParams,
        verify,
      )
    }
  }

  // 处理验证连接
  const handleVerifyApiKey = async (
    apiKey: string,
    baseUrl?: string,
    additionalParams?: Record<string, any>,
  ): Promise<void | ModelVerifyResult> => {
    return handleSaveApiKey(apiKey, baseUrl, additionalParams, true)
  }

  // 处理模型启用/禁用
  const handleEnableModel = useCallback(
    async (modelName: string, providerName: string, enabled: boolean) => {
      await enableLlm(providerName, modelName, enabled)
    },
    [enableLlm],
  )

  // 处理删除供应商
  const handleDeleteFactory = useCallback(
    async (factoryName: string) => {
      await deleteFactory(factoryName)
    },
    [deleteFactory],
  )

  if (isLoading && Object.keys(myLLMs).length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loading variant="spinner" size="lg" />
          <p className="mt-4 text-text-secondary">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex h-full w-full overflow-hidden rounded-lg border border-border bg-background">
      {/* 左侧区域 - 系统设置 + 已添加模型 */}
      <section className="flex w-3/5 flex-col gap-4 overflow-auto border-r border-border px-5 py-4">
        {/* 系统默认模型设置 */}
        <SystemSetting />

        {/* 已添加的模型 */}
        <UsedModels
          handleAddModel={handleAddModel}
          handleDeleteFactory={handleDeleteFactory}
          handleEnableModel={handleEnableModel}
        />
      </section>

      {/* 右侧区域 - 可选模型 */}
      <section className="flex w-2/5 flex-col overflow-auto">
        <AvailableModels handleAddModel={handleAddModel} />
      </section>

      {/* API Key 设置弹窗 */}
      <ApiKeyModal
        isOpen={apiKeyModal.isOpen}
        onClose={() =>
          setApiKeyModal({ isOpen: false, providerName: '', isLocal: false })
        }
        providerName={apiKeyModal.providerName}
        isLocal={apiKeyModal.isLocal}
        onSave={handleSaveApiKey}
        onVerify={handleVerifyApiKey}
      />
    </div>
  )
}

export default ModelProvidersPage
