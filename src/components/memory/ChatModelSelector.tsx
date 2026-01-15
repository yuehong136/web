/**
 * 对话模型选择器
 * 复用 EmbeddingModelSelector 的模式，从 modelStore 获取 chat 和 image2text 类型模型
 */

import React, { useMemo, useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import { SelectWithSearch, type SelectOptionGroup } from '@/components/ui/select-with-search'
import { FormTooltip } from '@/components/ui/tooltip'
import { IconFontFill } from '@/components/ui/icon-font'
import { useModelStore, IconMap, LLMFactory } from '@/stores/model'
import { useIsDarkTheme } from '@/themes'

interface ChatModelSelectorProps {
  /** 当前选中的模型 ID（格式：modelName@providerName） */
  selectedModelId: string | null
  /** 模型选择变化回调 */
  onSelect: (modelId: string | null) => void
  /** 是否禁用 */
  disabled?: boolean
  /** 错误信息 */
  error?: string
  /** 是否显示标签 */
  showLabel?: boolean
  /** 自定义标签文本 */
  labelText?: string
  /** 提示文本 */
  tooltipText?: string
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
  if (THEME_AWARE_FACTORIES.includes(provider as typeof LLMFactory[keyof typeof LLMFactory])) {
    return isDark ? `${baseIcon}-dark` : `${baseIcon}-bright`
  }
  return baseIcon
}

// 带图标的模型选项 Label（与系统设置页面保持一致）
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

/**
 * 对话模型选择器
 * 直接从 modelStore 获取数据，与模型提供商页面的设置保持一致
 */
export const ChatModelSelector: React.FC<ChatModelSelectorProps> = ({
  selectedModelId,
  onSelect,
  disabled = false,
  error,
  showLabel = true,
  labelText = '对话模型',
  tooltipText = '用于记忆提取和总结的大语言模型。选择适合的模型可以提升记忆处理的质量。'
}) => {
  const { myLLMs, loadMyLLMs, isLoading } = useModelStore()

  // 加载模型列表
  useEffect(() => {
    if (Object.keys(myLLMs).length === 0) {
      loadMyLLMs()
    }
  }, [myLLMs, loadMyLLMs])

  // 支持的模型类型：chat 和 image2text
  const SUPPORTED_MODEL_TYPES = ['chat', 'image2text']

  // 按厂商分组选项（与系统设置页面保持一致）
  const groupedOptions = useMemo((): SelectOptionGroup[] => {
    const groups: SelectOptionGroup[] = []
    
    Object.entries(myLLMs).forEach(([providerName, providerData]) => {
      // 过滤出 chat 和 image2text 类型的模型
      const supportedModels = providerData.llm.filter(model => 
        SUPPORTED_MODEL_TYPES.includes(model.type)
      )
      
      if (supportedModels.length > 0) {
        groups.push({
          label: providerName,
          options: supportedModels.map(model => ({
            label: (
              <ModelOptionLabel 
                provider={providerName} 
                modelName={model.name}
              />
            ),
            // 使用 name@provider 格式作为 value，与系统设置页面保持一致
            value: `${model.name}@${providerName}`
          }))
        })
      }
    })

    return groups
  }, [myLLMs])

  // 构建所有支持的模型的 value 映射（用于查找匹配）
  const allModelValues = useMemo(() => {
    const values: Map<string, string> = new Map()
    Object.entries(myLLMs).forEach(([providerName, providerData]) => {
      providerData.llm
        .filter(model => SUPPORTED_MODEL_TYPES.includes(model.type))
        .forEach(model => {
          const fullValue = `${model.name}@${providerName}`
          // 存储多种可能的匹配格式
          values.set(fullValue.toLowerCase(), fullValue)
          values.set(model.name.toLowerCase(), fullValue)
        })
    })
    return values
  }, [myLLMs])

  // 规范化选中的模型 ID（匹配 API 返回格式与选择器 value 格式）
  const normalizedValue = useMemo(() => {
    if (!selectedModelId) return ''
    const lowerValue = selectedModelId.toLowerCase()
    // 直接匹配
    if (allModelValues.has(lowerValue)) {
      return allModelValues.get(lowerValue)!
    }
    // 尝试匹配（忽略大小写和连字符变化）
    for (const [key, fullValue] of allModelValues) {
      if (key.replace(/-/g, '').includes(lowerValue.replace(/-/g, '').replace(/@.*$/, ''))) {
        return fullValue
      }
    }
    return selectedModelId
  }, [selectedModelId, allModelValues])

  // 计算是否有可用模型
  const hasModels = groupedOptions.length > 0

  if (isLoading) {
    return (
      <div className="space-y-2">
        {showLabel && (
          <label className="block text-sm font-medium text-text-primary">{labelText}</label>
        )}
        <div className="w-full px-3 py-2 border border-border-default rounded-md bg-surface-secondary/50 flex items-center h-10">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-text-accent"></div>
          <span className="ml-2 text-text-tertiary text-sm">加载模型中...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-2">
        {showLabel && (
          <label className="block text-sm font-medium text-text-primary">{labelText}</label>
        )}
        <div className="w-full px-3 py-2 border border-status-error rounded-md bg-status-error/10 flex items-center h-10">
          <AlertCircle className="h-3 w-3 text-status-error" />
          <span className="ml-2 text-status-error text-sm">{error}</span>
        </div>
      </div>
    )
  }

  if (!hasModels) {
    return (
      <div className="space-y-2">
        {showLabel && (
          <label className="block text-sm font-medium text-text-primary">{labelText}</label>
        )}
        <div className="w-full px-3 py-2 border border-status-warning rounded-md bg-status-warning/10 flex items-center h-10">
          <AlertCircle className="h-3 w-3 text-status-warning" />
          <span className="ml-2 text-status-warning text-sm">暂无可用的对话模型，请先在模型供应商中添加</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="flex items-center mb-1">
          <label className="block text-sm font-medium text-text-primary">{labelText}</label>
          {tooltipText && <FormTooltip tooltip={tooltipText} />}
        </div>
      )}
      
      <SelectWithSearch
        value={normalizedValue}
        options={groupedOptions}
        onChange={(value) => onSelect(value || null)}
        placeholder="请选择对话模型"
        emptyText="未找到匹配的对话模型"
        triggerClassName="h-10"
        disabled={disabled}
      />
    </div>
  )
}

ChatModelSelector.displayName = 'ChatModelSelector'
