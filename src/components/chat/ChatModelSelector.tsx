import React from 'react'
import { Check, ChevronDown, MessageSquare, Image, AlertCircle, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/tooltip'
import { LLMFactory, IconMap } from '@/stores/model'
import type { MyLLMModel, MyLLMProvider } from '@/stores/model'

interface ChatModelSelectorProps {
  models: MyLLMProvider
  selectedModelName: string | null
  onSelect: (modelName: string | null) => void
  loading?: boolean
  error?: string
  modelTypes?: ('chat' | 'image2text')[] // 只显示聊天和图像识别模型
}

export const ChatModelSelector: React.FC<ChatModelSelectorProps> = ({
  models,
  selectedModelName,
  onSelect,
  loading = false,
  error,
  modelTypes = ['chat', 'image2text']
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [dropdownPosition, setDropdownPosition] = React.useState({ top: 0, left: 0, width: 0 })
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  // 筛选可用的聊天和图像识别模型
  const availableModels = React.useMemo(() => {
    const filtered: { provider: string; model: MyLLMModel }[] = []
    
    // 添加安全检查，确保 models 存在且不为空
    if (!models || typeof models !== 'object' || Object.keys(models).length === 0) {
      return []
    }
    
    try {
      Object.entries(models).forEach(([providerName, providerData]) => {
        // 确保 providerData 和 providerData.llm 存在且是数组
        if (providerData && 
            typeof providerData === 'object' && 
            providerData.llm && 
            Array.isArray(providerData.llm)) {
          providerData.llm.forEach(model => {
            if (model && 
                typeof model === 'object' && 
                model.type && 
                model.name &&
                (model.type === 'chat' || model.type === 'image2text')) {
              filtered.push({ provider: providerName, model })
            }
          })
        }
      })
    } catch (error) {
      console.warn('Error processing models in ChatModelSelector:', error)
      return []
    }

    return filtered.filter(item =>
      item?.model?.name && 
      item?.provider &&
      (item.model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       item.provider.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [models, modelTypes, searchTerm])

  // 按厂商分组模型
  const groupedModels = React.useMemo(() => {
    const groups: Record<string, { provider: string; model: MyLLMModel }[]> = {}
    
    availableModels.forEach(item => {
      const provider = item.provider
      if (!groups[provider]) {
        groups[provider] = []
      }
      groups[provider].push(item)
    })

    return groups
  }, [availableModels])

  // 查找选中的模型
  const selectedModel = React.useMemo(() => {
    return availableModels.find(item => item.model.name === selectedModelName)
  }, [availableModels, selectedModelName])

  // 计算下拉框位置
  const updateDropdownPosition = React.useCallback(() => {
    if (triggerRef.current && isOpen) {
      const rect = triggerRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const dropdownHeight = 240
      
      const spaceBelow = viewportHeight - rect.bottom
      const spaceAbove = rect.top
      
      let top = rect.bottom + window.scrollY
      
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        top = rect.top + window.scrollY - dropdownHeight
      }
      
      setDropdownPosition({
        top,
        left: rect.left + window.scrollX,
        width: rect.width
      })
    }
  }, [isOpen])

  // 点击外部关闭和位置更新
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleScroll = () => {
      if (isOpen) {
        updateDropdownPosition()
      }
    }

    const handleResize = () => {
      if (isOpen) {
        updateDropdownPosition()
      }
    }

    if (isOpen) {
      updateDropdownPosition()
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('scroll', handleScroll, true)
      document.addEventListener('resize', handleResize)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('scroll', handleScroll, true)
      document.removeEventListener('resize', handleResize)
    }
  }, [isOpen, updateDropdownPosition])

  const handleSelect = (modelName: string | null) => {
    onSelect(modelName)
    setIsOpen(false)
    setSearchTerm('')
  }

  const getProviderLogo = (name: string) => {
    try {
      const factoryKey = Object.values(LLMFactory).find(factory => factory === name)
      if (factoryKey && IconMap[factoryKey as keyof typeof IconMap]) {
        return `/src/assets/svg/llm/${IconMap[factoryKey as keyof typeof IconMap]}.svg`
      }
      
      const filename = name.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-_]/g, '')
      return `/src/assets/svg/llm/${filename}.svg`
    } catch {
      return null
    }
  }

  const getModelTypeIcon = (type: MyLLMModel['type']) => {
    switch (type) {
      case 'chat':
        return <MessageSquare className="h-3 w-3 text-green-500" />
      case 'image2text':
        return <Image className="h-3 w-3 text-blue-500" />
      default:
        return <MessageSquare className="h-3 w-3 text-gray-500" />
    }
  }

  const getModelTypeLabel = (type: MyLLMModel['type']) => {
    switch (type) {
      case 'chat':
        return '对话'
      case 'image2text':
        return '图像识别'
      default:
        return '未知'
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-700">
          聊天模型
        </label>
        <div className="relative">
          <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 flex items-center h-8">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-500 text-xs">加载模型中...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-700">
          聊天模型
        </label>
        <div className="relative">
          <div className="w-full px-3 py-2 border border-red-300 rounded-md bg-red-50 flex items-center h-8">
            <AlertCircle className="h-3 w-3 text-red-500" />
            <span className="ml-2 text-red-700 text-xs">{error}</span>
          </div>
        </div>
      </div>
    )
  }

  if (availableModels.length === 0) {
    return (
      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-700">
          聊天模型
        </label>
        <div className="relative">
          <div className="w-full px-3 py-2 border border-yellow-300 rounded-md bg-yellow-50 flex items-center h-8">
            <AlertCircle className="h-3 w-3 text-yellow-500" />
            <span className="ml-2 text-yellow-700 text-xs">暂无可用的聊天模型</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2" ref={dropdownRef}>
      <div className="flex items-center space-x-1 mb-1">
        <label className="block text-xs font-medium text-gray-700">
          聊天模型
        </label>
        <Tooltip content="选择用于对话或图像识别的模型">
          <HelpCircle className="h-3 w-3 text-gray-400 hover:text-gray-600" />
        </Tooltip>
      </div>
      
      {/* 选择器按钮 */}
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full px-3 py-2 text-left border rounded-md bg-white transition-all duration-200 h-8 text-xs",
            "hover:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500",
            isOpen ? "border-blue-500 ring-1 ring-blue-500/20" : "border-gray-300"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              {selectedModel ? (
                <>
                  <div className="w-4 h-4 flex-shrink-0">
                    <img 
                      src={getProviderLogo(selectedModel.provider) || ''} 
                      alt={selectedModel.provider}
                      className="w-4 h-4"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement
                        const fallback = target.nextElementSibling as HTMLElement
                        target.style.display = 'none'
                        if (fallback) fallback.style.display = 'flex'
                      }}
                    />
                    <div className="w-4 h-4 bg-blue-100 rounded flex items-center justify-center text-blue-600 font-semibold text-xs" style={{display: 'none'}}>
                      {selectedModel.provider.charAt(0)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate text-xs">
                      {selectedModel.model.name}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {getModelTypeIcon(selectedModel.model.type)}
                  </div>
                </>
              ) : (
                <div className="text-gray-500 text-xs">请选择聊天模型</div>
              )}
            </div>
            <ChevronDown 
              className={cn(
                "h-3 w-3 text-gray-400 transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </div>
        </button>

        {/* 下拉菜单 */}
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
            <div 
              ref={dropdownRef}
              className="fixed z-[9999] bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-hidden"
              style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: Math.max(dropdownPosition.width, 320),
                minWidth: '320px'
              }}>
              {/* 搜索框 */}
              <div className="p-2 border-b border-gray-100">
                <input
                  type="text"
                  placeholder="搜索聊天模型..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* 模型列表 */}
              <div className="max-h-48 overflow-y-auto">
                {Object.keys(groupedModels).length === 0 ? (
                  <div className="p-3 text-center text-gray-500 text-xs">
                    未找到匹配的聊天模型
                  </div>
                ) : (
                  Object.entries(groupedModels).map(([provider, providerModels]) => (
                    <div key={provider}>
                      {/* 厂商标题 */}
                      <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-700 flex items-center">
                        <div className="w-4 h-4 mr-2 flex-shrink-0">
                          <img 
                            src={getProviderLogo(provider) || ''} 
                            alt={provider}
                            className="w-4 h-4"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement
                              const fallback = target.nextElementSibling as HTMLElement
                              target.style.display = 'none'
                              if (fallback) fallback.style.display = 'flex'
                            }}
                          />
                          <div className="w-4 h-4 bg-blue-100 rounded flex items-center justify-center text-blue-600 font-semibold text-xs" style={{display: 'none'}}>
                            {provider.charAt(0)}
                          </div>
                        </div>
                        {provider}
                        <span className="ml-2 text-xs text-gray-500">
                          ({providerModels.length})
                        </span>
                      </div>

                      {/* 模型选项 */}
                      {providerModels.map((item) => (
                        <button
                          key={item.model.name}
                          type="button"
                          onClick={() => handleSelect(item.model.name)}
                          className={cn(
                            "w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors duration-150 border-b border-gray-50 last:border-b-0 text-xs",
                            selectedModelName === item.model.name && "bg-blue-50 border-blue-100"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 truncate">
                                  {item.model.name}
                                </div>
                                <div className="text-xs text-gray-500 flex items-center">
                                  {getModelTypeIcon(item.model.type)}
                                  <span className="ml-1">{getModelTypeLabel(item.model.type)}</span>
                                </div>
                              </div>
                              <div className="flex items-center">
                                {selectedModelName === item.model.name && (
                                  <Check className="h-3 w-3 text-blue-500" />
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