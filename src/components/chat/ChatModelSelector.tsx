import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, LoaderCircle, Settings } from 'lucide-react'
import {
  SelectWithSearch,
  type SelectOptionGroup,
} from '@/components/ui/select-with-search'
import { FormTooltip } from '@/components/ui/tooltip'
import { modelSelectOption } from '@/components/models/model-select-options'
import {
  getLLMModelValue,
  isLLMModelEnabled,
  resolveLLMDisplayValue,
  type MyLLMProvider,
} from '@/stores/model'
import { cn } from '@/lib/utils'

type ChatModelSelectorVariant = 'default' | 'compact' | 'minimal'
interface ChatModelSelectorProps {
  models: MyLLMProvider
  selectedModelName: string | null
  onSelect: (modelName: string | null) => void
  loading?: boolean
  error?: string
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
  const options = useMemo(
    (): SelectOptionGroup[] =>
      Object.entries(models ?? {}).flatMap(([provider, data]) => {
        const available = (data.llm ?? []).filter(
          (model) =>
            modelTypes.includes(model.type as 'chat' | 'image2text') &&
            isLLMModelEnabled(model),
        )
        const unique = [
          ...new Map(
            available.map((model) => [
              getLLMModelValue(model, provider, valueMode),
              model,
            ]),
          ).values(),
        ]
        return unique.length
          ? [
              {
                label: provider,
                options: unique.map((model) =>
                  modelSelectOption(model, provider, valueMode),
                ),
              },
            ]
          : []
      }),
    [models, modelTypes, valueMode],
  )
  const value = resolveLLMDisplayValue(models, selectedModelName, valueMode)
  const choices =
    value &&
    !options.some((group) =>
      group.options?.some((option) => option.value === value),
    )
      ? [
          {
            label: t('common.modelPicker.unavailable'),
            options: [{ label: selectedModelName, value, disabled: true }],
          },
          ...options,
        ]
      : options
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
      {loading ? (
        <div
          role="status"
          className="flex h-10 items-center gap-2 text-sm text-text-secondary"
        >
          <LoaderCircle aria-hidden className="size-4 animate-spin" />
          {t('chat.modelSelector.loading')}
        </div>
      ) : error ? (
        <div
          role="alert"
          className="flex items-center gap-2 text-sm text-status-error"
        >
          <AlertCircle aria-hidden className="size-4" />
          {error}
        </div>
      ) : !options.length ? (
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
        <SelectWithSearch
          value={value}
          options={choices}
          onChange={(next) => onSelect(next || null)}
          variant={actualVariant}
          side={
            actualVariant === 'default' || dropdownDirection === 'down'
              ? 'bottom'
              : 'top'
          }
          disabled={disabled}
          ariaLabel={t('chat.modelSelector.label')}
          placeholder={t('chat.modelSelector.placeholder')}
          searchPlaceholder={t('common.modelPicker.search')}
          emptyText={t('chat.modelSelector.noMatch')}
          triggerClassName={triggerClassName}
        />
      )}
    </div>
  )
}
