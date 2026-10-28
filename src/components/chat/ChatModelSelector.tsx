import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Settings } from 'lucide-react'
import { FormTooltip } from '@/components/ui/tooltip'
import { ModelSelect } from '@/components/models/model-select'
import { modelOptions } from '@/components/models/model-select-options'
import type { MyLLMProvider } from '@/stores/model'
import { cn } from '@/lib/utils'

type ChatModelSelectorVariant = 'default' | 'compact' | 'minimal'
interface ChatModelSelectorProps {
  models: MyLLMProvider
  selectedModelName: string | null
  onSelect: (modelName: string | null) => void
  loading?: boolean
  error?: string
  onRetry?: () => unknown
  modelTypes?: ('chat' | 'image2text')[]
  valueMode?: 'name' | 'nameWithProvider'
  variant?: ChatModelSelectorVariant
  /** @deprecated Use variant="compact". */
  compact?: boolean
  disabled?: boolean
  triggerClassName?: string
  dropdownDirection?: 'up' | 'down'
}
export function ChatModelSelector({
  models,
  selectedModelName,
  onSelect,
  loading = false,
  error,
  onRetry,
  modelTypes = ['chat', 'image2text'],
  valueMode = 'name',
  variant,
  compact = false,
  disabled = false,
  triggerClassName,
  dropdownDirection = 'up',
}: ChatModelSelectorProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const actualVariant = variant ?? (compact ? 'compact' : 'default')
  const choices = modelOptions(models ?? {}, modelTypes, valueMode)
  return (
    <div
      className={cn(
        'min-w-0 space-y-2',
        actualVariant !== 'default' && 'max-w-full',
      )}
    >
      {actualVariant === 'default' && (
        <div className="flex items-center gap-1 text-xs font-medium text-text-primary">
          {t('chat.modelSelector.label')}
          <FormTooltip tooltip={t('chat.modelSelector.tooltip')} />
        </div>
      )}
      {!selectedModelName && !loading && !error && !choices.options.length ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => navigate('/settings/model-providers')}
          title={t('home.input.configureModelAction')}
          className="flex h-10 items-center gap-2 rounded-radius-md px-3 text-sm text-status-warning hover:bg-status-warning-subtle"
        >
          <Settings aria-hidden className="size-4" />
          {t('home.input.configureModel')}
        </button>
      ) : (
        <ModelSelect
          {...choices}
          value={selectedModelName ?? ''}
          onChange={(next) => onSelect(next || null)}
          loading={loading}
          error={error}
          onRetry={onRetry}
          variant={actualVariant}
          side={
            actualVariant === 'default' || dropdownDirection === 'down'
              ? 'bottom'
              : 'top'
          }
          disabled={disabled}
          ariaLabel={t('chat.modelSelector.label')}
          placeholder={t('chat.modelSelector.placeholder')}
          emptyText={t('chat.modelSelector.noMatch')}
          triggerClassName={triggerClassName}
        />
      )}
    </div>
  )
}
