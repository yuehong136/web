import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Zap, AlertCircle, X } from 'lucide-react'
import {
  SelectWithSearch,
  type SelectOptionGroup,
} from '@/components/ui/select-with-search'
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
    <div className="flex w-full min-w-0 items-center gap-2">
      <IconFontFill name={iconName} className="h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <span className="block truncate">{modelName}</span>
      </div>
      <div className="flex shrink-0 items-center gap-1 text-xs text-text-tertiary">
        <Zap className="h-3 w-3 text-success" />
        <span>{formatTokens(maxTokens)}</span>
      </div>
    </div>
  )
}

// 不使用重排序选项 Label
const NoRerankLabel: React.FC = () => {
  const { t } = useTranslation()
  return (
    <div className="flex w-full min-w-0 items-center gap-2 text-text-secondary">
      <X className="h-4 w-4 shrink-0" />
      <span>{t('knowledge.search.rerank.none')}</span>
    </div>
  )
}

export const RerankModelSelector: React.FC<RerankModelSelectorProps> = ({
  models,
  selectedModelId,
  onSelect,
  loading = false,
  error,
}) => {
  const { t } = useTranslation()
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
    models.forEach((model) => {
      const provider = model.fid || t('knowledge.search.rerank.providerOther')
      if (!groups[provider]) {
        groups[provider] = []
      }
      groups[provider].push(model)
    })

    Object.entries(groups).forEach(([provider, providerModels]) => {
      result.push({
        label: provider,
        options: providerModels.map((model) => ({
          label: (
            <ModelOptionLabel
              provider={provider}
              modelName={model.llm_name}
              maxTokens={model.max_tokens}
            />
          ),
          value: model.llm_name,
        })),
      })
    })

    return result
  }, [models, t])

  // 处理值转换（null <-> NO_RERANK_VALUE）
  const handleChange = (value: string) => {
    if (value === NO_RERANK_VALUE || value === '') {
      onSelect(null)
    } else {
      onSelect(value)
    }
  }

  // 当前值（null 转为 NO_RERANK_VALUE）
  const currentValue =
    selectedModelId === null ? NO_RERANK_VALUE : selectedModelId || ''

  if (loading) {
    return (
      <div className="space-y-2">
        <label className="block text-xs font-medium text-text-primary">
          {t('knowledge.search.rerank.label')}
        </label>
        <div className="bg-surface-secondary flex h-10 w-full items-center rounded-md border border-border px-3 py-2">
          <div
            className="h-3 w-3 animate-spin rounded-full border-b-2"
            style={{
              borderBottomColor: 'var(--color-components-slider-range)',
            }}
          />
          <span className="ml-2 text-xs text-text-tertiary">
            {t('knowledge.search.rerank.loading')}
          </span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-2">
        <label className="block text-xs font-medium text-text-primary">
          {t('knowledge.search.rerank.label')}
        </label>
        <div className="bg-error/10 flex h-10 w-full items-center rounded-md border border-error px-3 py-2">
          <AlertCircle className="h-3 w-3 text-error" />
          <span className="ml-2 text-xs text-error">{error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="mb-1 flex items-center">
        <label className="block text-xs font-medium text-text-primary">
          {t('knowledge.search.rerank.label')}
        </label>
        <FormTooltip tooltip={t('knowledge.search.rerank.tooltip')} />
      </div>

      <SelectWithSearch
        value={currentValue}
        options={groupedOptions}
        onChange={handleChange}
        placeholder={t('knowledge.search.rerank.placeholder')}
        emptyText={t('knowledge.search.rerank.empty')}
        triggerClassName="h-10"
      />
    </div>
  )
}
