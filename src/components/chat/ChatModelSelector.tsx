import React from 'react'
import { createPortal } from 'react-dom'
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

  // 获取所有可用的聊天和图像识别模型（不含搜索过滤）
  const allAvailableModels = React.useMemo(() => {
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

    return filtered
  }, [models, modelTypes])

  // 根据搜索条件过滤模型
  const availableModels = React.useMemo(() => {
    if (!searchTerm.trim()) {
      return allAvailableModels
    }
    
    return allAvailableModels.filter(item =>
      item?.model?.name && 
      item?.provider &&
      (item.model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       item.provider.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [allAvailableModels, searchTerm])

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

  // 查找选中的模型（从所有模型中查找，不受搜索影响）
  const selectedModel = React.useMemo(() => {
    return allAvailableModels.find(item => item.model.name === selectedModelName)
  }, [allAvailableModels, selectedModelName])

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
        // 关闭时重置搜索条件（延迟重置，避免闪烁）
        setTimeout(() => {
          setSearchTerm('')
        }, 150)
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

  // 处理双击搜索框清空
  const handleSearchDoubleClick = () => {
    setSearchTerm('')
  }

  // 处理搜索框的键盘事件
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (searchTerm) {
        // 如果有搜索内容，先清除搜索
        setSearchTerm('')
      } else {
        // 如果没有搜索内容，关闭下拉框
        setIsOpen(false)
      }
    }
  }

  // 清除搜索条件的函数
  const clearSearch = () => {
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
        return <MessageSquare className="h-3 w-3 text-success" />
      case 'image2text':
        return <Image className="h-3 w-3 text-primary" />
      default:
        return <MessageSquare className="h-3 w-3 text-muted-foreground" />
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
        <label className="block text-xs font-medium text-foreground">
          聊天模型
        </label>
        <div className="relative">
          <div className="w-full px-3 py-2 border border-input rounded-md bg-muted flex items-center h-8">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground text-xs">加载模型中...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-2">
        <label className="block text-xs font-medium text-foreground">
          聊天模型
        </label>
        <div className="relative">
          <div className="w-full px-3 py-2 border border-destructive rounded-md bg-destructive/10 flex items-center h-8">
            <AlertCircle className="h-3 w-3 text-destructive" />
            <span className="ml-2 text-destructive text-xs">{error}</span>
          </div>
        </div>
      </div>
    )
  }

  // 只有在真正没有模型时才显示警告（而不是搜索无结果）
  if (allAvailableModels.length === 0) {
    return (
      <div className="space-y-2">
        <label className="block text-xs font-medium text-foreground">
          聊天模型
        </label>
        <div className="relative">
          <div className="w-full px-3 py-2 border border-warning rounded-md bg-warning/10 flex items-center h-8">
            <AlertCircle className="h-3 w-3 text-warning" />
            <span className="ml-2 text-warning text-xs">暂无可用的聊天模型</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2" ref={dropdownRef}>
      <div className="flex items-center space-x-1 mb-1">
        <label className="block text-xs font-medium text-foreground">
          聊天模型
        </label>
        <Tooltip content="选择用于对话或图像识别的模型">
          <HelpCircle className="h-3 w-3 text-muted-foreground hover:text-foreground" />
        </Tooltip>
      </div>
      
      {/* 选择器按钮 */}
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => {
            if (!isOpen) {
              // 打开时不清除搜索，保持用户上次的搜索状态
              setIsOpen(true)
            } else {
              setIsOpen(false)
            }
          }}
          className={cn(
            "w-full px-3 py-2 text-left border rounded-md bg-background transition-all duration-200 h-8 text-xs",
            "hover:border-primary/30 focus:outline-none focus:ring-1 focus:ring-ring/20 focus:border-primary",
            isOpen ? "border-primary ring-1 ring-ring/20" : "border-input"
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
                    <div className="w-4 h-4 bg-primary/10 rounded flex items-center justify-center text-primary font-semibold text-xs" style={{display: 'none'}}>
                      {selectedModel.provider.charAt(0)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate text-xs">
                      {selectedModel.model.name}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {getModelTypeIcon(selectedModel.model.type)}
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground text-xs">请选择聊天模型</div>
              )}
            </div>
            <ChevronDown 
              className={cn(
                "h-3 w-3 text-muted-foreground transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </div>
        </button>

        {/* 下拉菜单 - 使用Portal渲染到body */}
        {isOpen && createPortal(
          <>
            <div 
              className="fixed inset-0" 
              style={{ 
                zIndex: 2147483646,
                backgroundColor: 'var(--color-components-model-selector-overlay-bg)'
              }} 
              onClick={() => setIsOpen(false)} 
            />
            <div 
              ref={dropdownRef}
              className="fixed rounded-md max-h-64 overflow-hidden"
              style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: Math.max(dropdownPosition.width, 380),
                minWidth: '380px',
                position: 'fixed',
                zIndex: 2147483647,
                isolation: 'isolate',
                backgroundColor: 'var(--color-components-model-selector-dropdown-bg)',
                border: '1px solid var(--color-components-model-selector-dropdown-border)',
                boxShadow: 'var(--color-components-model-selector-dropdown-shadow)'
              }}>
              {/* 搜索框 */}
              <div 
                className="p-2" 
                style={{ borderBottom: '1px solid var(--color-components-model-selector-dropdown-border)' }}
              >
                <div className="relative">
                  <input
                    type="text"
                    placeholder="搜索聊天模型..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    onDoubleClick={handleSearchDoubleClick}
                    className="w-full px-2 py-1 pr-6 text-xs rounded focus:outline-none focus:ring-1"
                    style={{
                      backgroundColor: 'var(--color-components-model-selector-search-bg)',
                      border: '1px solid var(--color-components-model-selector-search-border)',
                      color: 'var(--color-components-model-selector-search-text)'
                    }}
                    autoFocus
                  />
                  {searchTerm && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      type="button"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* 模型列表 */}
              <div className="max-h-52 overflow-y-auto scrollbar-thin">
                {Object.keys(groupedModels).length === 0 ? (
                  <div className="p-4 text-center">
                    <div className="text-xs mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
                      {searchTerm ? `未找到匹配 "${searchTerm}" 的聊天模型` : '未找到匹配的聊天模型'}
                    </div>
                    {searchTerm && (
                      <div className="space-y-2">
                        <button
                          onClick={clearSearch}
                          className="block w-full px-3 py-1.5 text-xs rounded border border-border hover:bg-accent/10 transition-colors"
                          style={{ color: 'var(--color-state-focus)' }}
                        >
                          清除搜索条件
                        </button>
                        <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                          提示：按 ESC 键或双击搜索框也可清除搜索
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  Object.entries(groupedModels).map(([provider, providerModels]) => (
                    <div key={provider}>
                      {/* 厂商标题 */}
                      <div 
                        className="px-3 py-2 text-xs font-medium flex items-center"
                        style={{
                          backgroundColor: 'var(--color-components-model-selector-provider-header-bg)',
                          borderBottom: '1px solid var(--color-components-model-selector-provider-header-border)',
                          color: 'var(--color-components-model-selector-provider-header-text)'
                        }}>
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
                          <div className="w-4 h-4 bg-primary/10 rounded flex items-center justify-center text-primary font-semibold text-xs" style={{display: 'none'}}>
                            {provider.charAt(0)}
                          </div>
                        </div>
                        {provider}
                        <span className="ml-2 text-xs text-muted-foreground">
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
                            "w-full px-3 py-2 text-left transition-colors duration-150 text-xs last:border-b-0 model-selector-item",
                            selectedModelName === item.model.name && "selected"
                          )}
                          style={{
                            backgroundColor: selectedModelName === item.model.name 
                              ? 'var(--color-components-model-selector-item-bg-selected)' 
                              : 'var(--color-components-model-selector-item-bg)',
                            borderBottom: '1px solid var(--color-components-model-selector-item-border)',
                            color: selectedModelName === item.model.name 
                              ? 'var(--color-components-model-selector-item-text-selected)' 
                              : 'var(--color-components-model-selector-item-text)'
                          }}
                          onMouseEnter={(e) => {
                            if (selectedModelName !== item.model.name) {
                              e.currentTarget.style.backgroundColor = 'var(--color-components-model-selector-item-bg-hover)'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedModelName !== item.model.name) {
                              e.currentTarget.style.backgroundColor = 'var(--color-components-model-selector-item-bg)'
                            }
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-foreground truncate">
                                  {item.model.name}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center">
                                  {getModelTypeIcon(item.model.type)}
                                  <span className="ml-1">{getModelTypeLabel(item.model.type)}</span>
                                </div>
                              </div>
                              <div className="flex items-center">
                                {selectedModelName === item.model.name && (
                                  <Check className="h-3 w-3 text-primary" />
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
          </>,
          document.body
        )}
      </div>
    </div>
  )
}