import React from 'react'
import { Check, ChevronDown, Zap, Info, AlertCircle, HelpCircle } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Tooltip } from '../ui/tooltip'
import type { LLMModel } from '../../types/api'

interface EmbeddingModelSelectorProps {
  models: LLMModel[]
  selectedModelId: string
  onSelect: (modelId: string) => void
  loading?: boolean
  error?: string
}

export const EmbeddingModelSelector: React.FC<EmbeddingModelSelectorProps> = ({
  models,
  selectedModelId,
  onSelect,
  loading = false,
  error
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState('')
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  const selectedModel = models.find(model => model.id === selectedModelId)

  // 按厂商分组模型
  const groupedModels = React.useMemo(() => {
    const filtered = models.filter(model =>
      model.llm_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.fid.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const groups: Record<string, LLMModel[]> = {}
    filtered.forEach(model => {
      const provider = model.fid || '其他'
      if (!groups[provider]) {
        groups[provider] = []
      }
      groups[provider].push(model)
    })

    return groups
  }, [models, searchTerm])

  // 点击外部关闭
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (modelId: string) => {
    onSelect(modelId)
    setIsOpen(false)
    setSearchTerm('')
  }

  const formatTokens = (tokens: number | undefined) => {
    if (!tokens || isNaN(tokens)) {
      return 'N/A'
    }
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(0)}K`
    }
    return tokens.toString()
  }

  const getModelIcon = (provider: string) => {
    const icons: Record<string, string> = {
      'OpenAI': '🤖',
      'Tongyi-Qianwen': '🌟',
      'ZHIPU-AI': '🧠',
      'Youdao': '📚',
      'BAAI': '🔬',
      'SILICONFLOW': '💎',
      'Gemini': '💫',
      'Cohere': '🌊',
      'Voyage AI': '🚀',
      'NVIDIA': '🔥',
      'Jina': '🎯',
      'Mistral': '⚡',
      'BaiChuan': '🏔️',
      'Upstage': '📈',
      'NovitaAI': '✨'
    }
    return icons[provider] || '🔧'
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          向量模型 *
        </label>
        <div className="relative">
          <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-500">加载向量模型中...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          向量模型 *
        </label>
        <div className="relative">
          <div className="w-full px-4 py-3 border border-red-300 rounded-lg bg-red-50 flex items-center">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="ml-3 text-red-700">{error}</span>
          </div>
        </div>
      </div>
    )
  }

  if (models.length === 0) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          向量模型 *
        </label>
        <div className="relative">
          <div className="w-full px-4 py-3 border border-yellow-300 rounded-lg bg-yellow-50 flex items-center">
            <Info className="h-4 w-4 text-yellow-500" />
            <span className="ml-3 text-yellow-700">暂无可用的向量模型，请联系管理员配置</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2" ref={dropdownRef}>
      <div className="flex items-center space-x-2 mb-2">
        <label className="block text-sm font-medium text-gray-700">
          向量模型 *
        </label>
        <Tooltip content="选择用于文档向量化的模型，影响检索质量和速度">
          <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600" />
        </Tooltip>
      </div>
      
      {/* 选择器按钮 */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full px-4 py-3 text-left border rounded-lg bg-white transition-all duration-200",
            "hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
            isOpen ? "border-blue-500 ring-2 ring-blue-500/20" : "border-gray-300"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {selectedModel ? (
                <>
                  <span className="text-lg">{getModelIcon(selectedModel.fid)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {selectedModel.llm_name}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center space-x-2">
                      <span>{selectedModel.fid}</span>
                      <span>•</span>
                      <span>{formatTokens(selectedModel.max_tokens)} tokens</span>
                      <Zap className="h-3 w-3 ml-1" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-gray-500">请选择向量模型</div>
              )}
            </div>
            <ChevronDown 
              className={cn(
                "h-5 w-5 text-gray-400 transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </div>
        </button>

        {/* 下拉菜单 */}
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <div className="absolute z-20 mt-2 w-full min-w-96 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
              {/* 搜索框 */}
              <div className="p-3 border-b border-gray-100">
                <input
                  type="text"
                  placeholder="搜索模型..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* 模型列表 */}
              <div className="max-h-64 overflow-y-auto">
                {Object.keys(groupedModels).length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    未找到匹配的模型
                  </div>
                ) : (
                  Object.entries(groupedModels).map(([provider, providerModels]) => (
                    <div key={provider}>
                      {/* 厂商标题 */}
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-700 flex items-center">
                        <span className="text-lg mr-2">{getModelIcon(provider)}</span>
                        {provider}
                        <span className="ml-2 text-xs text-gray-500">
                          ({providerModels.length} 个模型)
                        </span>
                      </div>

                      {/* 模型选项 */}
                      {providerModels.map((model) => (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() => handleSelect(model.id)}
                          className={cn(
                            "w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors duration-150 border-b border-gray-50 last:border-b-0",
                            selectedModelId === model.id && "bg-blue-50 border-blue-100"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 truncate">
                                  {model.llm_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {formatTokens(model.max_tokens)} tokens
                                </div>
                              </div>
                              <div className="flex items-center">
                                <Zap className="h-4 w-4 text-green-500" />
                                {selectedModelId === model.id && (
                                  <Check className="h-4 w-4 text-blue-500 ml-2" />
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  )
}