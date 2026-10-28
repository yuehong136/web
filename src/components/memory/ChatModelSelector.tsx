import { useTranslation } from 'react-i18next'
import { FormTooltip } from '@/components/ui/tooltip'
import { ModelSelect } from '@/components/models/model-select'
import { modelOptions } from '@/components/models/model-select-options'
import { useFetchMyLLMs } from '@/hooks/use-llm-request'

interface ChatModelSelectorProps {
  selectedModelId: string | null
  onSelect: (modelId: string | null) => void
  disabled?: boolean
  error?: string
  showLabel?: boolean
  labelText?: string
  tooltipText?: string
}
export function ChatModelSelector({
  selectedModelId,
  onSelect,
  disabled,
  error,
  showLabel = true,
  labelText,
  tooltipText,
}: ChatModelSelectorProps) {
  const { t } = useTranslation()
  const query = useFetchMyLLMs()
  const label = labelText ?? t('memory.fields.llm')
  const tooltip = tooltipText ?? t('memory.fields.llmTooltip')
  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="flex items-center text-sm font-medium text-text-primary">
          {label}
          <FormTooltip tooltip={tooltip} />
        </div>
      )}
      <ModelSelect
        {...modelOptions(query.myLLMs, ['chat', 'image2text'])}
        value={selectedModelId ?? ''}
        onChange={(value) => onSelect(value || null)}
        loading={query.isPending}
        error={error || query.isError}
        onRetry={query.refetch}
        disabled={disabled}
        ariaLabel={label}
        placeholder={t('memory.model.chatPlaceholder')}
        emptyText={t('memory.model.chatEmpty')}
        triggerClassName="h-10"
      />
    </div>
  )
}
