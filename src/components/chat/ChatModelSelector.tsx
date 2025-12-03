import React, { useMemo } from 'react'
import { AlertCircle } from 'lucide-react'
import { SelectWithSearch, type SelectOptionGroup } from '@/components/ui/select-with-search'
import { FormTooltip } from '@/components/ui/tooltip'
import { IconFontFill } from '@/components/ui/icon-font'
import { IconMap, LLMFactory } from '@/stores/model'
import { useIsDarkTheme } from '@/themes'
import type { MyLLMModel, MyLLMProvider } from '@/stores/model'

interface ChatModelSelectorProps {
  models: MyLLMProvider
  selectedModelName: string | null
  onSelect: (modelName: string | null) => void
  loading?: boolean
  error?: string
  modelTypes?: ('chat' | 'image2text')[]
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
  if (THEME_AWARE_FACTORIES.includes(provider as LLMFactory)) {
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
  modelTypes = ['chat', 'image2text']
}) => {
  const isDark = useIsDarkTheme()

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
            if (model?.type && model?.name && modelTypes.includes(model.type as 'chat' | 'image2text')) {
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
        <div className="w-full px-3 py-2 border border-warning rounded-md bg-warning/10 flex items-center h-10">
          <AlertCircle className="h-3 w-3 text-warning" />
          <span className="ml-2 text-warning text-xs">暂无可用的聊天模型</span>
        </div>
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
        triggerClassName="h-10"
      />
    </div>
  )
}
