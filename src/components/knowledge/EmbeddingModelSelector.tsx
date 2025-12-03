import React, { useMemo } from 'react'
import { Zap, AlertCircle } from 'lucide-react'
import { SelectWithSearch, type SelectOptionGroup } from '@/components/ui/select-with-search'
import { FormTooltip } from '@/components/ui/tooltip'
import { IconFontFill } from '@/components/ui/icon-font'
import { IconMap, LLMFactory } from '@/stores/model'
import { useIsDarkTheme } from '@/themes'
import type { LLMModel } from '@/types/api'

interface EmbeddingModelSelectorProps {
  models: LLMModel[]
  selectedModelId: string | null
  onSelect: (modelId: string | null) => void
  loading?: boolean
  error?: string
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

// 格式化 token 数量
const formatTokens = (tokens: number | undefined) => {
  if (!tokens || isNaN(tokens)) return 'N/A'
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(0)}K`
  return tokens.toString()
}

// 带图标的模型选项 Label
const ModelOptionLabel: React.FC<{ 
  provider: string
  modelName: string
  maxTokens?: number
}> = ({ provider, modelName, maxTokens }) => {
  const isDark = useIsDarkTheme()
  const iconName = getIconName(provider, isDark)
  
  return (
    <div className="flex items-center gap-2 min-w-0 w-full">
      <IconFontFill name={iconName} className="w-4 h-4 shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="truncate block">{modelName}</span>
      </div>
      <div className="flex items-center gap-1 shrink-0 text-text-tertiary text-xs">
        <Zap className="h-3 w-3 text-success" />
        <span>{formatTokens(maxTokens)}</span>
      </div>
    </div>
  )
}

export const EmbeddingModelSelector: React.FC<EmbeddingModelSelectorProps> = ({
  models,
  selectedModelId,
  onSelect,
  loading = false,
  error
}) => {
  // 按厂商分组选项
  const groupedOptions = useMemo((): SelectOptionGroup[] => {
    const groups: Record<string, LLMModel[]> = {}
    
    models.forEach(model => {
      const provider = model.fid || '其他'
      if (!groups[provider]) {
        groups[provider] = []
      }
      groups[provider].push(model)
    })

    return Object.entries(groups).map(([provider, providerModels]) => ({
      label: provider,
      options: providerModels.map(model => ({
        label: (
          <ModelOptionLabel 
            provider={provider} 
            modelName={model.llm_name} 
            maxTokens={model.max_tokens}
          />
        ),
        value: model.llm_name
      }))
    }))
  }, [models])

  // 获取选中模型的显示 Label
  const selectedLabel = useMemo(() => {
    const model = models.find(m => m.llm_name === selectedModelId)
    if (!model) return null
    return (
      <ModelOptionLabel 
        provider={model.fid} 
        modelName={model.llm_name} 
        maxTokens={model.max_tokens}
      />
    )
  }, [models, selectedModelId])

  if (loading) {
    return (
      <div className="space-y-2">
        <label className="block text-xs font-medium text-text-primary">嵌入模型</label>
        <div className="w-full px-3 py-2 border border-border rounded-md bg-accent/20 flex items-center h-10">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
          <span className="ml-2 text-text-tertiary text-xs">加载嵌入模型中...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-2">
        <label className="block text-xs font-medium text-text-primary">嵌入模型</label>
        <div className="w-full px-3 py-2 border border-error rounded-md bg-error/10 flex items-center h-10">
          <AlertCircle className="h-3 w-3 text-error" />
          <span className="ml-2 text-error text-xs">{error}</span>
        </div>
      </div>
    )
  }

  if (models.length === 0) {
    return (
      <div className="space-y-2">
        <label className="block text-xs font-medium text-text-primary">嵌入模型</label>
        <div className="w-full px-3 py-2 border border-warning rounded-md bg-warning/10 flex items-center h-10">
          <AlertCircle className="h-3 w-3 text-warning" />
          <span className="ml-2 text-warning text-xs">暂无可用的嵌入模型</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center mb-1">
        <label className="block text-xs font-medium text-text-primary">嵌入模型</label>
        <FormTooltip tooltip="用于文档向量化的嵌入模型，影响检索质量" />
      </div>
      
      <SelectWithSearch
        value={selectedModelId || ''}
        options={groupedOptions}
        onChange={(value) => onSelect(value || null)}
        placeholder="请选择嵌入模型"
        emptyText="未找到匹配的嵌入模型"
        triggerClassName="h-10"
      />
    </div>
  )
}
