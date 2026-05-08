import React, { useMemo, useState, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ChevronDown, Check, Settings } from 'lucide-react'
import { SelectWithSearch, type SelectOptionGroup } from '@/components/ui/select-with-search'
import { FormTooltip } from '@/components/ui/tooltip'
import { IconFontFill } from '@/components/ui/icon-font'
import { IconMap, LLMFactory, isLLMModelEnabled } from '@/stores/model'
import { useIsDarkTheme } from '@/themes'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import type { MyLLMModel, MyLLMProvider } from '@/stores/model'

type ChatModelSelectorVariant = 'default' | 'compact' | 'minimal'

interface ChatModelSelectorProps {
  models: MyLLMProvider
  selectedModelName: string | null
  onSelect: (modelName: string | null) => void
  loading?: boolean
  error?: string
  modelTypes?: ('chat' | 'image2text')[]
  /** 
   * 显示变体：
   * - default: 带 label 的表单样式
   * - compact: 紧凑的选择框样式（有边框）
   * - minimal: 最小化样式，无边框，只显示模型名字和箭头（类似 Claude app）
   */
  variant?: ChatModelSelectorVariant
  /** @deprecated 使用 variant="compact" 代替 */
  compact?: boolean
  /** 禁用状态 */
  disabled?: boolean
  /** 自定义触发器类名 */
  triggerClassName?: string
  /** 下拉方向（仅 minimal 模式有效）：up=向上弹出，down=向下弹出 */
  dropdownDirection?: 'up' | 'down'
}

// 需要主题切换的厂商
const THEME_AWARE_FACTORIES = [
  LLMFactory.FishAudio,
  LLMFactory.TogetherAI,
  LLMFactory.Meituan,
  LLMFactory.Longcat,
]

// 获取图标名称
const getIconName = (provider: string, isDark: boolean): string => {
  const baseIcon = IconMap[provider as keyof typeof IconMap] || 'moxing-default'
  if (THEME_AWARE_FACTORIES.includes(provider as any)) {
    return isDark ? `${baseIcon}-dark` : `${baseIcon}-bright`
  }
  return baseIcon
}

// 带图标的模型选项 Label
const ModelOptionLabel: React.FC<{ 
  provider: string
  modelName: string
}> = ({ provider, modelName }) => {
  const isDark = useIsDarkTheme()
  const iconName = getIconName(provider, isDark)
  
  return (
    <div className="flex items-center gap-2 min-w-0 w-full">
      <IconFontFill name={iconName} className="w-5 h-5 shrink-0" />
      <span className="truncate">{modelName}</span>
    </div>
  )
}

export const ChatModelSelector: React.FC<ChatModelSelectorProps> = ({
  models,
  selectedModelName,
  onSelect,
  loading = false,
  error,
  modelTypes = ['chat', 'image2text'],
  variant,
  compact = false,
  disabled = false,
  triggerClassName,
  dropdownDirection = 'up',
}) => {
  const isDark = useIsDarkTheme()
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  // 跳转到模型提供商配置页面
  const handleGoToModelProviders = () => {
    navigate('/settings/model-providers')
  }

  // 兼容旧的 compact 属性
  const actualVariant: ChatModelSelectorVariant = variant || (compact ? 'compact' : 'default')

  // 获取所有可用的聊天和图像识别模型
  const allAvailableModels = useMemo(() => {
    const filtered: { provider: string; model: MyLLMModel }[] = []
    
    if (!models || typeof models !== 'object' || Object.keys(models).length === 0) {
      return []
    }
    
    try {
      Object.entries(models).forEach(([providerName, providerData]) => {
        if (providerData?.llm && Array.isArray(providerData.llm)) {
          providerData.llm.forEach(model => {
            if (
              model?.type &&
              model?.name &&
              modelTypes.includes(model.type as 'chat' | 'image2text') &&
              isLLMModelEnabled(model)
            ) {
              filtered.push({ provider: providerName, model })
            }
          })
        }
      })
    } catch (err) {
      console.warn('Error processing models in ChatModelSelector:', err)
      return []
    }

    return filtered
  }, [models, modelTypes])

  // 构建分组选项
  const groupedOptions = useMemo((): SelectOptionGroup[] => {
    const groups: Record<string, { provider: string; model: MyLLMModel }[]> = {}
    
    allAvailableModels.forEach(item => {
      if (!groups[item.provider]) {
        groups[item.provider] = []
      }
      groups[item.provider].push(item)
    })

    return Object.entries(groups).map(([provider, items]) => ({
      label: provider,
      options: items.map(item => ({
        label: (
          <ModelOptionLabel 
            provider={provider} 
            modelName={item.model.name} 
          />
        ),
        value: item.model.name
      }))
    }))
  }, [allAvailableModels])

  // 找到当前选中模型的信息
  const selectedModelInfo = useMemo(() => {
    if (!selectedModelName) return null
    return allAvailableModels.find(item => item.model.name === selectedModelName)
  }, [selectedModelName, allAvailableModels])



  // minimal 模式：无边框触发按钮，下拉内容与 SelectWithSearch 完全一致
  if (actualVariant === 'minimal') {
    if (loading) {
      return (
        <div className="flex items-center gap-1 text-text-tertiary">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-text-tertiary"></div>
        </div>
      )
    }

    if (allAvailableModels.length === 0) {
      return (
        <button
          onClick={handleGoToModelProviders}
          className={cn(
            "flex items-center gap-space-sm h-10 px-space-md rounded-radius-lg transition-all",
            "text-base font-medium",
            "text-state-warning hover:bg-state-warning-subtle",
            triggerClassName
          )}
          title="点击配置模型"
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">配置模型</span>
        </button>
      )
    }

    const handleSelect = (val: string) => {
      onSelect(val)
      setIsOpen(false)
    }

    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          {/* 触发按钮 - 与 @ 按钮风格一致：悬停时浅灰背景+阴影，展开时蓝绿背景+阴影 */}
          <button
            disabled={disabled}
            className={cn(
              "flex items-center gap-space-sm h-10 px-space-md rounded-radius-lg transition-all",
              "text-base font-medium",
              isOpen
                ? "bg-state-focus-subtle text-state-focus shadow-elevation-low"
                : "bg-transparent text-text-tertiary hover:bg-background-subtle hover:shadow-elevation-low",
              disabled && "opacity-50 cursor-not-allowed",
              triggerClassName
            )}
          >
            {selectedModelInfo && (
              <IconFontFill
                name={getIconName(selectedModelInfo.provider, isDark)}
                className="w-5 h-5 shrink-0"
              />
            )}
            <span className="whitespace-nowrap">
              {selectedModelName || '选择模型'}
            </span>
            <ChevronDown className={cn(
              "w-4 h-4 transition-transform shrink-0 ml-1",
              isOpen ? "rotate-180 text-state-focus" : "text-text-tertiary"
            )} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="border-border w-full min-w-[var(--radix-popper-anchor-width)] p-0"
          align="end"
          side={dropdownDirection === 'up' ? 'top' : 'bottom'}
        >
          <Command className="p-4">
            {groupedOptions.length > 0 && (
              <CommandInput
                placeholder="搜索..."
                className="placeholder:text-text-tertiary"
              />
            )}
            <CommandList className="mt-2 outline-none">
              <CommandEmpty>
                <div className="text-text-tertiary">未找到匹配的模型</div>
              </CommandEmpty>
              {groupedOptions.map((group, idx) => {
                if (group.options && group.options.length > 0) {
                  return (
                    <Fragment key={idx}>
                      <CommandGroup heading={group.label}>
                        {group.options.map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.value}
                            onSelect={handleSelect}
                            className={cn(
                              'min-h-9',
                              selectedModelName === option.value ? 'bg-background-subtle' : ''
                            )}
                          >
                            <span className="leading-none flex-1">{option.label}</span>
                            {selectedModelName === option.value && (
                              <Check className="w-4 h-4 ml-auto text-primary" />
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Fragment>
                  )
                }
                return null
              })}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }

  // compact 模式：有边框的选择框，下拉内容与 SelectWithSearch 完全一致
  if (actualVariant === 'compact') {
    if (loading) {
      return (
        <div className="h-10 px-3 rounded-lg bg-surface-secondary animate-pulse flex items-center">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
        </div>
      )
    }

    if (allAvailableModels.length === 0) {
      return (
        <button
          onClick={handleGoToModelProviders}
          className={cn(
            "flex items-center gap-space-sm h-10 px-space-md rounded-radius-lg transition-all",
            "border border-state-warning",
            "text-base font-medium",
            "text-state-warning hover:bg-state-warning-subtle",
            triggerClassName
          )}
          title="点击配置模型"
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">配置模型</span>
        </button>
      )
    }

    const handleSelect = (val: string) => {
      onSelect(val)
      setIsOpen(false)
    }

    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          {/* 触发按钮 - 有边框样式，与 @ 按钮风格一致 */}
          <button
            disabled={disabled}
            className={cn(
              "flex items-center gap-space-sm h-10 px-space-md rounded-radius-lg transition-all",
              "border border-border",
              "text-base font-medium",
              isOpen
                ? "bg-state-focus-subtle text-state-focus shadow-elevation-low border-transparent"
                : "bg-transparent text-text-tertiary hover:bg-background-subtle hover:shadow-elevation-low",
              disabled && "opacity-50 cursor-not-allowed",
              triggerClassName
            )}
          >
            {selectedModelInfo && (
              <IconFontFill 
                name={getIconName(selectedModelInfo.provider, isDark)} 
                className="w-5 h-5 shrink-0" 
              />
            )}
            <span className="whitespace-nowrap">
              {selectedModelName || '选择模型'}
            </span>
            <ChevronDown className={cn(
              "w-4 h-4 transition-transform shrink-0 ml-1",
              isOpen ? "rotate-180 text-state-focus" : "text-text-tertiary"
            )} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="border-border w-full min-w-[var(--radix-popper-anchor-width)] p-0"
          align="end"
          side={dropdownDirection === 'up' ? 'top' : 'bottom'}
        >
          <Command className="p-4">
            {groupedOptions.length > 0 && (
              <CommandInput
                placeholder="搜索..."
                className="placeholder:text-text-tertiary"
              />
            )}
            <CommandList className="mt-2 outline-none">
              <CommandEmpty>
                <div className="text-text-tertiary">未找到匹配的模型</div>
              </CommandEmpty>
              {groupedOptions.map((group, idx) => {
                if (group.options && group.options.length > 0) {
                  return (
                    <Fragment key={idx}>
                      <CommandGroup heading={group.label}>
                        {group.options.map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.value}
                            onSelect={handleSelect}
                            className={cn(
                              'min-h-9',
                              selectedModelName === option.value ? 'bg-background-subtle' : ''
                            )}
                          >
                            <span className="leading-none flex-1">{option.label}</span>
                            {selectedModelName === option.value && (
                              <Check className="w-4 h-4 ml-auto text-primary" />
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Fragment>
                  )
                }
                return null
              })}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }

  // 标准模式
  if (loading) {
    return (
      <div className="space-y-2">
        <label className="block text-xs font-medium text-text-primary">聊天模型</label>
        <div className="w-full px-3 py-2 border border-border rounded-md bg-accent/20 flex items-center h-10">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
          <span className="ml-2 text-text-tertiary text-xs">加载模型中...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-2">
        <label className="block text-xs font-medium text-text-primary">聊天模型</label>
        <div className="w-full px-3 py-2 border border-error rounded-md bg-error/10 flex items-center h-10">
          <AlertCircle className="h-3 w-3 text-error" />
          <span className="ml-2 text-error text-xs">{error}</span>
        </div>
      </div>
    )
  }

  if (allAvailableModels.length === 0) {
    return (
      <div className="space-y-2">
        <label className="block text-xs font-medium text-text-primary">聊天模型</label>
        <button
          onClick={handleGoToModelProviders}
          className="w-full px-3 py-2 border border-state-warning rounded-md bg-state-warning-subtle flex items-center h-10 hover:bg-state-warning/20 transition-colors cursor-pointer"
        >
          <AlertCircle className="h-3 w-3 text-state-warning shrink-0" />
          <span className="ml-2 text-state-warning text-xs">暂无可用模型，点击前往配置</span>
          <Settings className="h-3 w-3 text-state-warning ml-auto shrink-0" />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center mb-1">
        <label className="block text-xs font-medium text-text-primary">聊天模型</label>
        <FormTooltip tooltip="选择用于对话或图像识别的模型" />
      </div>
      
      <SelectWithSearch
        value={selectedModelName || ''}
        options={groupedOptions}
        onChange={(value) => onSelect(value || null)}
        placeholder="请选择聊天模型"
        emptyText="未找到匹配的聊天模型"
        disabled={disabled}
        triggerClassName={triggerClassName || "h-10"}
      />
    </div>
  )
}
