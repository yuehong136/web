import React, { useMemo } from 'react'
import { Zap, AlertCircle, X } from 'lucide-react'
import { SelectWithSearch, type SelectOptionGroup } from '@/components/ui/select-with-search'
import { FormTooltip } from '@/components/ui/tooltip'
import { IconFontFill } from '@/components/ui/icon-font'
import { IconMap, LLMFactory } from '@/stores/model'
import { useIsDarkTheme } from '@/themes'
import type { LLMModel } from '@/types/api'

interface RerankModelSelectorProps {
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

// 特殊值：不使用重排序
const NO_RERANK_VALUE = '__NO_RERANK__'

// 获取图标名称
const getIconName = (provider: string, isDark: boolean): string => {
  const baseIcon = IconMap[provider as keyof typeof IconMap] || 'moxing-default'
  if (THEME_AWARE_FACTORIES.includes(provider as any)) {
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

// 不使用重排序选项 Label
const NoRerankLabel: React.FC = () => (
  <div className="flex items-center gap-2 min-w-0 w-full text-text-secondary">
    <X className="w-4 h-4 shrink-0" />
    <span>不使用重排序</span>
  </div>
)

export const RerankModelSelector: React.FC<RerankModelSelectorProps> = ({
  models,
  selectedModelId,
  onSelect,
  loading = false,
  error
}) => {
  // 按厂商分组选项，并添加"不使用重排序"选项
  const groupedOptions = useMemo((): SelectOptionGroup[] => {
    const result: SelectOptionGroup[] = []
    
    // 添加"不使用重排序"选项
    result.push({
      label: <NoRerankLabel />,
      value: NO_RERANK_VALUE,
    })
    
    // 按厂商分组
    const groups: Record<string, LLMModel[]> = {}
    models.forEach(model => {
      const provider = model.fid || '其他'
      if (!groups[provider]) {
        groups[provider] = []
      }
      groups[provider].push(model)
    })

    Object.entries(groups).forEach(([provider, providerModels]) => {
      result.push({
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
      })
    })

    return result
  }, [models])

  // 处理值转换（null <-> NO_RERANK_VALUE）
  const handleChange = (value: string) => {
    if (value === NO_RERANK_VALUE || value === '') {
      onSelect(null)
    } else {
      onSelect(value)
    }
  }

  // 当前值（null 转为 NO_RERANK_VALUE）
  const currentValue = selectedModelId === null ? NO_RERANK_VALUE : (selectedModelId || '')

  if (loading) {
    return (
      <div className="space-y-2">
        <label className="block text-xs font-medium text-text-primary">重排序模型</label>
        <div className="w-full px-3 py-2 border border-border rounded-md bg-surface-secondary flex items-center h-10">
          <div
            className="animate-spin rounded-full h-3 w-3 border-b-2"
            style={{ borderBottomColor: 'var(--color-components-slider-range)' }}
          />
          <span className="ml-2 text-text-tertiary text-xs">加载重排序模型中...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-2">
        <label className="block text-xs font-medium text-text-primary">重排序模型</label>
        <div className="w-full px-3 py-2 border border-error rounded-md bg-error/10 flex items-center h-10">
          <AlertCircle className="h-3 w-3 text-error" />
          <span className="ml-2 text-error text-xs">{error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center mb-1">
        <label className="block text-xs font-medium text-text-primary">重排序模型</label>
        <FormTooltip tooltip="可选。用于对初始检索结果进行重新排序，提高结果质量" />
      </div>
      
      <SelectWithSearch
        value={currentValue}
        options={groupedOptions}
        onChange={handleChange}
        placeholder="选择重排序模型"
        emptyText="未找到匹配的重排序模型"
        triggerClassName="h-10"
      />
    </div>
  )
}
