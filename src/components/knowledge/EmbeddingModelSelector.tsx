import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { FormTooltip } from '@/components/ui/tooltip'
import { ModelSelect } from '@/components/models/model-select'
import { modelOptions } from '@/components/models/model-select-options'
import type { MyLLMProvider } from '@/stores/model'

export interface EmbeddingModelSelectorProps {
  selectedModelId: string | null
  onSelect: (modelId: string | null) => void
  modelProviders: MyLLMProvider
  isLoadingModels?: boolean
  disabled?: boolean
  error?: string
  onRetry?: () => unknown
  showLabel?: boolean
}
export const EmbeddingModelSelector: FC<EmbeddingModelSelectorProps> = ({
  selectedModelId,
  onSelect,
  modelProviders,
  isLoadingModels,
  disabled,
  error,
  onRetry,
  showLabel = true,
}) => {
  const { t } = useTranslation()
  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="flex items-center text-sm font-medium text-text-primary">
          {t('common.embeddingSelector.label')}
          <FormTooltip tooltip={t('common.embeddingSelector.tooltip')} />
        </div>
      )}
      <ModelSelect
        {...modelOptions(modelProviders, ['embedding'])}
        value={selectedModelId ?? ''}
        onChange={(value) => onSelect(value || null)}
        loading={isLoadingModels}
        error={error}
        onRetry={onRetry}
        disabled={disabled}
        ariaLabel={t('common.embeddingSelector.label')}
        placeholder={t('common.embeddingSelector.placeholder')}
        emptyText={t('common.embeddingSelector.noResults')}
        triggerClassName="h-10"
      />
    </div>
  )
}
