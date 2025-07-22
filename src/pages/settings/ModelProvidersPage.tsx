import React from 'react'
import { Plus, Settings, Zap, ExternalLink, ChevronDown, Database, BarChart3, Key, X } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Loading } from '../../components/ui/loading'
import { useModelStore, type LLMFactoryInterface, LLMFactory, IconMap } from '../../stores/model'
import { cn } from '../../lib/utils'

// API Key设置弹窗组件
const APIKeyModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  providerName: string;
  onSave: (apiKey: string, baseUrl?: string) => Promise<void>;
}> = ({ isOpen, onClose, providerName, onSave }) => {
  const [apiKey, setApiKey] = React.useState('')
  const [baseUrl, setBaseUrl] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)

  const handleSave = async () => {
    if (!apiKey.trim()) return
    
    setIsLoading(true)
    try {
      await onSave(apiKey, baseUrl || undefined)
      setApiKey('')
      setBaseUrl('')
      onClose()
    } catch (error) {
      console.error('保存API Key失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setApiKey('')
    setBaseUrl('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Key className="w-5 h-5 mr-2 text-blue-600" />
            设置 {providerName} API Key
          </h3>
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key *
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="请输入API Key"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Base URL (可选)
            </label>
            <input
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.example.com/v1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50 rounded-b-xl">
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            取消
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!apiKey.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? '保存中...' : '确定'}
          </Button>
        </div>
      </div>
    </div>
  )
}

const getModelTypeColor = (type: string) => {
  const colors = {
    chat: 'bg-blue-100 text-blue-800 border-blue-200',
    embedding: 'bg-green-100 text-green-800 border-green-200',
    rerank: 'bg-purple-100 text-purple-800 border-purple-200',
    image2text: 'bg-orange-100 text-orange-800 border-orange-200',
    tts: 'bg-pink-100 text-pink-800 border-pink-200',
    speech2text: 'bg-indigo-100 text-indigo-800 border-indigo-200'
  }
  return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
}

const getModelTypeLabel = (type: string) => {
  const labels = {
    chat: '对话',
    embedding: '嵌入',
    rerank: '重排',
    image2text: '图转文',
    tts: '语音合成',
    speech2text: '语音识别'
  }
  return labels[type as keyof typeof labels] || type
}

// 可折叠的供应商卡片组件
const CollapsibleProviderCard: React.FC<{
  providerName: string;
  providerData: any;
  isExpanded: boolean;
  onToggle: () => void;
  onSetApiKey: () => void;
}> = ({ providerName, providerData, isExpanded, onToggle, onSetApiKey }) => {
  const getProviderLogo = (name: string) => {
    try {
      // 先尝试从IconMap中获取对应的图标文件名
      const factoryKey = Object.values(LLMFactory).find(factory => factory === name)
      if (factoryKey && IconMap[factoryKey]) {
        return `/src/assets/svg/llm/${IconMap[factoryKey]}.svg`
      }
      
      // 如果没有找到，使用原来的逻辑作为后备方案
      const filename = name.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-_]/g, '')
      return `/src/assets/svg/llm/${filename}.svg`
    } catch {
      return null
    }
  }

  const totalTokens = providerData.llm.reduce((sum: number, model: any) => sum + model.used_token, 0)

  return (
    <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-200">
      {/* 卡片头部 - 点击展开/收起 */}
      <div 
        className="p-6 cursor-pointer bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border flex items-center justify-center">
              <img 
                src={getProviderLogo(providerName) || ''} 
                alt={providerName}
                className="w-8 h-8"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement
                  const fallback = target.nextElementSibling as HTMLElement
                  target.style.display = 'none'
                  if (fallback) fallback.style.display = 'flex'
                }}
              />
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-semibold text-sm" style={{display: 'none'}}>
                {providerName.charAt(0)}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">{providerName}</h3>
              <div className="flex items-center space-x-4 mt-1">
                <span className="text-sm text-gray-500 flex items-center">
                  <Database className="w-3 h-3 mr-1" />
                  {providerData.llm.length} 个模型
                </span>
                <span className="text-sm text-gray-500 flex items-center">
                  <BarChart3 className="w-3 h-3 mr-1" />
                  {totalTokens.toLocaleString()} tokens
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full border border-green-200">
              已配置
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1 h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
                onSetApiKey()
              }}
              title="设置API Key"
            >
              <Key className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
              <Settings className="h-4 w-4" />
            </Button>
            <div className={cn(
              "transition-transform duration-200",
              isExpanded ? "rotate-180" : "rotate-0"
            )}>
              <ChevronDown className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="mt-4 flex flex-wrap gap-2">
          {providerData.tags.split(',').map((tag: string, index: number) => (
            <span
              key={index}
              className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-md border"
            >
              {tag.trim()}
            </span>
          ))}
        </div>
      </div>

      {/* 展开的模型列表 */}
      {isExpanded && (
        <div className="border-t bg-white">
          <div className="p-6">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center">
              <Database className="w-4 h-4 mr-2" />
              模型列表
            </h4>
            <div className="grid gap-3">
              {providerData.llm.map((model: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <span className={cn(
                      "px-2 py-1 rounded-md text-xs font-medium border",
                      getModelTypeColor(model.type)
                    )}>
                      {getModelTypeLabel(model.type)}
                    </span>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{model.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {model.used_token.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">tokens</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

// 可用供应商卡片组件
const AvailableProviderCard: React.FC<{
  factory: LLMFactoryInterface;
  onAdd: () => void;
}> = ({ factory, onAdd }) => {
  const getProviderLogo = (name: string) => {
    try {
      // 先尝试从IconMap中获取对应的图标文件名
      const factoryKey = Object.values(LLMFactory).find(factory => factory === name)
      if (factoryKey && IconMap[factoryKey]) {
        return `/src/assets/svg/llm/${IconMap[factoryKey]}.svg`
      }
      
      // 如果没有找到，使用原来的逻辑作为后备方案
      const filename = name.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-_]/g, '')
      return `/src/assets/svg/llm/${filename}.svg`
    } catch {
      return null
    }
  }

  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-200 border-0 shadow-md">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-50 rounded-xl border flex items-center justify-center">
            <img 
              src={getProviderLogo(factory.name) || ''} 
              alt={factory.name}
              className="w-8 h-8"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement
                const fallback = target.nextElementSibling as HTMLElement
                target.style.display = 'none'
                if (fallback) fallback.style.display = 'flex'
              }}
            />
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-semibold text-sm" style={{display: 'none'}}>
              {factory.name.charAt(0)}
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{factory.name}</h4>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-sm text-gray-500 flex items-center">
                <Database className="w-3 h-3 mr-1" />
                {factory.model_types.length} 种模型
              </span>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium",
                factory.status === "1" 
                  ? "bg-green-100 text-green-800 border border-green-200" 
                  : "bg-red-100 text-red-800 border border-red-200"
              )}>
                {factory.status === "1" ? "可用" : "不可用"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {factory.model_types.map((type, index) => (
            <span
              key={index}
              className={cn(
                "px-2 py-1 rounded-md text-xs font-medium border",
                getModelTypeColor(type)
              )}
            >
              {getModelTypeLabel(type)}
            </span>
          ))}
        </div>
      </div>

      <div className="flex space-x-2">
        <Button 
          onClick={onAdd}
          disabled={factory.status !== "1"}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          添加模型
        </Button>
        <Button variant="outline" size="sm">
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}

export const ModelProvidersPage: React.FC = () => {
  const { 
    myLLMs,
    factories,
    isLoading,
    loadMyLLMs,
    loadFactories,
    setApiKey
  } = useModelStore()

  const [expandedProviders, setExpandedProviders] = React.useState<Record<string, boolean>>({})
  const [apiKeyModal, setApiKeyModal] = React.useState<{
    isOpen: boolean;
    providerName: string;
  }>({
    isOpen: false,
    providerName: ''
  })

  React.useEffect(() => {
    // 调试认证状态
    const token = localStorage.getItem('auth_token')
    console.log('Current auth token:', token ? token.substring(0, 20) + '...' : 'No token')
    console.log('API client has token:', (window as any).apiClient?.getAuthToken?.() ? 'Yes' : 'No')
    console.log('Loading model providers...')
    
    loadMyLLMs()
    loadFactories()
  }, [loadMyLLMs, loadFactories])

  // 需要使用add_llm接口的特殊厂商
  const specialFactories = [
    'VolcEngine', 'LocalAI', 'HuggingFace', 'OpenAI-API-Compatible', 
    'VLLM', 'XunFei Spark', 'Fish Audio', 'Google Cloud', 
    'Azure-OpenAI', 'Bedrock', 'Tencent Hunyuan', 'Tencent Cloud'
  ]

  const handleAddProvider = async (factory: LLMFactoryInterface) => {
    try {
      if (specialFactories.includes(factory.name)) {
        // 特殊厂商需要单独添加模型，这里暂时提示用户
        console.log(`${factory.name} 需要单独添加模型，请使用单独添加功能`)
        // TODO: 可以弹出一个选择模型的对话框
      } else {
        // 普通厂商使用批量添加（通过set_api_key）
        setApiKeyModal({
          isOpen: true,
          providerName: factory.name
        })
      }
    } catch (error) {
      console.error('添加模型供应商失败:', error)
    }
  }

  const toggleProvider = (providerName: string) => {
    setExpandedProviders(prev => ({
      ...prev,
      [providerName]: !prev[providerName]
    }))
  }

  const handleOpenApiKeyModal = (providerName: string) => {
    setApiKeyModal({
      isOpen: true,
      providerName
    })
  }

  const handleCloseApiKeyModal = () => {
    setApiKeyModal({
      isOpen: false,
      providerName: ''
    })
  }

  const handleSaveApiKey = async (apiKey: string, baseUrl?: string) => {
    try {
      await setApiKey(apiKeyModal.providerName, apiKey, baseUrl)
      console.log(`${apiKeyModal.providerName} API Key 设置成功`)
    } catch (error) {
      console.error('设置API Key失败:', error)
      throw error
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loading variant="spinner" size="lg" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      {/* 页面头部统计 */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">AI模型管理</h2>
            <p className="text-gray-600 mt-1">
              管理您的AI模型供应商配置和使用情况
            </p>
          </div>
          <div className="flex space-x-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{Object.keys(myLLMs).length}</div>
              <div className="text-sm text-blue-600">已配置供应商</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
              <div className="text-2xl font-bold text-green-600">{factories.length}</div>
              <div className="text-sm text-green-600">可用供应商</div>
            </div>
          </div>
        </div>
      </div>

      {/* 已添加的供应商 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-6">
          <Zap className="h-5 w-5 mr-2 text-green-600" />
          已配置的供应商
        </h3>

        {Object.keys(myLLMs).length === 0 ? (
          <Card className="p-12 text-center border-dashed border-2">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              还没有配置任何供应商
            </h3>
            <p className="text-gray-500">
              从下方的可用供应商中选择并添加您需要的AI模型服务
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(myLLMs).map(([providerName, providerData]) => (
              <CollapsibleProviderCard
                key={providerName}
                providerName={providerName}
                providerData={providerData}
                isExpanded={expandedProviders[providerName] || false}
                onToggle={() => toggleProvider(providerName)}
                onSetApiKey={() => handleOpenApiKeyModal(providerName)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 可用的供应商 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-6">
          <Plus className="h-5 w-5 mr-2 text-blue-600" />
          可用的供应商
        </h3>

        {factories.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              暂无可用供应商
            </h3>
            <p className="text-gray-500">
              系统中暂时没有可添加的模型供应商
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {factories.map((factory) => (
              <AvailableProviderCard
                key={factory.id}
                factory={factory}
                onAdd={() => handleAddProvider(factory)}
              />
            ))}
          </div>
        )}
      </div>

      {/* API Key设置弹窗 */}
      <APIKeyModal
        isOpen={apiKeyModal.isOpen}
        onClose={handleCloseApiKeyModal}
        providerName={apiKeyModal.providerName}
        onSave={handleSaveApiKey}
      />
    </div>
  )
}