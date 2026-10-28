import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle, X } from 'lucide-react'
import {
  SelectWithSearch,
  type SelectOptionGroup,
} from '@/components/ui/select-with-search'
import { FormTooltip } from '@/components/ui/tooltip'
import { ProviderIcon } from '@/components/ui/provider-icon'
import { ModelCapabilities } from '@/components/models/model-capabilities'
import type { LLMModel } from '@/types/api'

interface RerankModelSelectorProps {
  models: LLMModel[]
  selectedModelId: string | null
  onSelect: (modelId: string | null) => void
  loading?: boolean
  error?: string
}

const NO_RERANK_VALUE = '__NO_RERANK__'

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
          label: model.llm_name,
          icon: (
            <ProviderIcon provider={provider} className="size-5" size={20} />
          ),
          description: <ModelCapabilities types={['rerank']} />,
          keywords: [model.llm_name, provider],
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
        <div className="flex h-10 w-full items-center rounded-md border border-border bg-surface-secondary px-3 py-2">
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
        <div className="flex h-10 w-full items-center rounded-md border border-status-error-border bg-status-error-subtle px-3 py-2">
          <AlertCircle className="h-3 w-3 text-status-error" />
          <span className="ml-2 text-xs text-status-error">{error}</span>
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
