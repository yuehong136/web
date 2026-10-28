import { resolveLLMDisplayValue } from '@/stores/model'
import { useMemo, type FC } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle } from 'lucide-react'
import {
  SelectWithSearch,
  type SelectOptionGroup,
} from '@/components/ui/select-with-search'
import { FormTooltip } from '@/components/ui/tooltip'
import { modelSelectOption } from '@/components/models/model-select-options'
import { isLLMModelEnabled, type MyLLMProvider } from '@/stores/model'

export interface EmbeddingModelSelectorProps {
  selectedModelId: string | null
  onSelect: (modelId: string | null) => void
  modelProviders: MyLLMProvider
  isLoadingModels?: boolean
  disabled?: boolean
  error?: string
  showLabel?: boolean
}

export const EmbeddingModelSelector: FC<EmbeddingModelSelectorProps> = ({
  selectedModelId,
  onSelect,
  modelProviders,
  isLoadingModels = false,
  disabled = false,
  error,
  showLabel = true,
}) => {
  const { t } = useTranslation()

  const groupedOptions = useMemo((): SelectOptionGroup[] => {
    const groups: SelectOptionGroup[] = []

    Object.entries(modelProviders).forEach(([providerName, providerData]) => {
      const embeddingModels = providerData.llm.filter(
        (model) => model.type === 'embedding' && isLLMModelEnabled(model),
      )

      if (embeddingModels.length > 0) {
        groups.push({
          label: providerName,
          options: embeddingModels.map((model) =>
            modelSelectOption(model, providerName),
          ),
        })
      }
    })

    return groups
  }, [modelProviders])

  const normalizedValue = resolveLLMDisplayValue(
    modelProviders,
    selectedModelId,
  )

  const hasModels = groupedOptions.length > 0
  const label = t('knowledge.embeddingSelector.label')

  if (isLoadingModels) {
    return (
      <div className="space-y-2">
        {showLabel && (
          <div className="block text-sm font-medium text-text-primary">
            {label}
          </div>
        )}
        <div className="flex h-10 w-full items-center rounded-md border border-border-default bg-surface-secondary/50 px-3 py-2">
          <div className="h-3 w-3 animate-spin rounded-full border-b-2 border-text-accent"></div>
          <span className="ml-2 text-sm text-text-tertiary">
            {t('knowledge.embeddingSelector.loading')}
          </span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-2">
        {showLabel && (
          <div className="block text-sm font-medium text-text-primary">
            {label}
          </div>
        )}
        <div className="flex h-10 w-full items-center rounded-md border border-status-error-border bg-status-error-subtle px-3 py-2">
          <AlertCircle className="h-3 w-3 text-status-error" />
          <span className="ml-2 text-sm text-status-error">{error}</span>
        </div>
      </div>
    )
  }

  if (!hasModels) {
    return (
      <div className="space-y-2">
        {showLabel && (
          <div className="block text-sm font-medium text-text-primary">
            {label}
          </div>
        )}
        <div className="flex h-10 w-full items-center rounded-md border border-status-warning-border bg-status-warning-subtle px-3 py-2">
          <AlertCircle className="h-3 w-3 text-status-warning" />
          <span className="ml-2 text-sm text-status-warning">
            {t('knowledge.embeddingSelector.empty')}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="mb-1 flex items-center">
          <div className="block text-sm font-medium text-text-primary">
            {label}
          </div>
          <FormTooltip tooltip={t('knowledge.embeddingSelector.tooltip')} />
        </div>
      )}

      <SelectWithSearch
        value={normalizedValue}
        options={groupedOptions}
        onChange={(value) => onSelect(value || null)}
        placeholder={t('knowledge.embeddingSelector.placeholder')}
        emptyText={t('knowledge.embeddingSelector.noResults')}
        triggerClassName="h-10"
        disabled={disabled}
      />
    </div>
  )
}
