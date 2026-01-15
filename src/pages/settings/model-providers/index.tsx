import React, { useEffect, useCallback } from 'react'
import { useModelStore, type AddLlmParams } from '@/stores/model'
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
  'ModelScope'
]

// 特殊配置厂商（需要使用 add_llm 接口）
const SPECIAL_CONFIG_FACTORIES = [
  'VolcEngine',
  'Bedrock',
  'Azure-OpenAI',
  'Tencent Hunyuan',
  'Tencent Cloud',
  'XunFei Spark',
  'BaiduYiyan',
  'Fish Audio',
  'Google Cloud',
  'MinerU',
]

export const ModelProvidersPage: React.FC = () => {
  const { 
    myLLMs,
    factories,
    isLoading,
    loadMyLLMs,
    loadFactories,
    setApiKey,
    addLlm,
    deleteFactory,
  } = useModelStore()

  const [apiKeyModal, setApiKeyModal] = React.useState<{
    isOpen: boolean
    providerName: string
    isLocal?: boolean
  }>({
    isOpen: false,
    providerName: '',
    isLocal: false
  })

  useEffect(() => {
    loadMyLLMs()
    loadFactories()
  }, [loadMyLLMs, loadFactories])

  // 处理添加模型
  const handleAddModel = useCallback((factoryName: string) => {
    const isLocal = LOCAL_MODEL_FACTORIES.includes(factoryName)
    
    setApiKeyModal({
      isOpen: true,
      providerName: factoryName,
      isLocal
    })
  }, [])

  // 处理保存 - 根据厂商类型调用不同的 API
  const handleSaveApiKey = async (apiKey: string, baseUrl?: string, additionalParams?: Record<string, any>) => {
    const isLocal = LOCAL_MODEL_FACTORIES.includes(apiKeyModal.providerName)
    const isSpecialConfig = SPECIAL_CONFIG_FACTORIES.includes(apiKeyModal.providerName)
    
    // 特殊配置厂商和本地模型使用 add_llm 接口
    // 注意：Hunyuan 不需要 llm_name，只需要 SID 和 SK
    const needsAddLlm = isLocal || isSpecialConfig
    const hasRequiredParams = additionalParams?.llm_name || additionalParams?.hunyuan_sid
    
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
        ...additionalParams
      }
      await addLlm(params)
    } else {
      // 普通云服务厂商使用 set_api_key 接口
      await setApiKey(apiKeyModal.providerName, apiKey, baseUrl, additionalParams)
    }
  }

  // 处理删除供应商
  const handleDeleteFactory = useCallback(async (factoryName: string) => {
    await deleteFactory(factoryName)
  }, [deleteFactory])

  if (isLoading && Object.keys(myLLMs).length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loading variant="spinner" size="lg" />
          <p className="text-text-secondary mt-4">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full h-full border border-border rounded-lg relative overflow-hidden bg-background">
      {/* 左侧区域 - 系统设置 + 已添加模型 */}
      <section className="flex flex-col gap-4 w-3/5 px-5 py-4 border-r border-border overflow-auto">
        {/* 系统默认模型设置 */}
        <SystemSetting />
        
        {/* 已添加的模型 */}
        <UsedModels 
          handleAddModel={handleAddModel}
          handleDeleteFactory={handleDeleteFactory}
        />
      </section>

      {/* 右侧区域 - 可选模型 */}
      <section className="flex flex-col w-2/5 overflow-auto">
        <AvailableModels handleAddModel={handleAddModel} />
      </section>

      {/* API Key 设置弹窗 */}
      <ApiKeyModal
        isOpen={apiKeyModal.isOpen}
        onClose={() => setApiKeyModal({ isOpen: false, providerName: '', isLocal: false })}
        providerName={apiKeyModal.providerName}
        isLocal={apiKeyModal.isLocal}
        onSave={handleSaveApiKey}
      />
    </div>
  )
}

export default ModelProvidersPage

