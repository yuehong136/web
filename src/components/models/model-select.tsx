import { forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle, LoaderCircle } from 'lucide-react'
import {
  SelectWithSearch,
  type SelectWithSearchProps,
} from '@/components/ui/select-with-search'
import { Button } from '@/components/ui/button'
import { ProviderIcon } from '@/components/ui/provider-icon'
import { parseLLMValue } from '@/stores/model'
import type { ModelOption } from './model-select-options'

export interface ModelSelectProps extends SelectWithSearchProps {
  knownOptions?: ModelOption[]
  loading?: boolean
  error?: unknown
  onRetry?: () => unknown
  showStatus?: boolean
  /** Built-in parsers remain usable while optional model inventory loads. */
  allowPartialOptions?: boolean
}

/** Model identity is separate from its persisted reference and inventory status. */
export const ModelSelect = forwardRef<HTMLButtonElement, ModelSelectProps>(
  function ModelSelect(
    {
      knownOptions = [],
      options = [],
      value = '',
      loading,
      error,
      onRetry,
      allowPartialOptions,
      showStatus = true,
      disabled,
      ...props
    },
    ref,
  ) {
    const { t } = useTranslation()
    const choices: ModelOption[] = options.flatMap(
      (group) =>
        group.options ??
        (group.value ? [{ ...group, value: group.value }] : []),
    )
    const metadata = [...choices, ...knownOptions]
    const matches = metadata.filter((option) => option.value === value)
    const aliases = [
      ...new Map(
        metadata
          .filter((option) => option.aliases?.includes(value))
          .map((option) => [option.value, option]),
      ).values(),
    ]
    const saved = matches[0] ?? (aliases.length === 1 ? aliases[0] : undefined)
    const available =
      saved &&
      choices.some((option) => option.value === saved.value && !option.disabled)
    const uncertain = !!loading || !!error
    const { modelName, providerName } = parseLLMValue(value)
    const readableName = /^#?\d+$/.test(modelName)
      ? t('common.modelPicker.savedModel')
      : modelName
    const unavailable = !uncertain && !available
    const current = value
      ? {
          ...saved,
          value,
          label: unavailable ? (
            <span>
              {saved?.label ?? readableName} ·{' '}
              {t('common.modelPicker.unavailableShort')}
            </span>
          ) : (
            (saved?.label ?? readableName)
          ),
          icon:
            saved?.icon ??
            (providerName ? (
              <ProviderIcon provider={providerName} size={20} />
            ) : undefined),
          disabled: unavailable || !available,
        }
      : undefined
    const resolved =
      current && !available
        ? [
            current,
            ...options
              .filter((group) => group.value !== value)
              .map((group) =>
                group.options
                  ? {
                      ...group,
                      options: group.options.filter(
                        (option) => option.value !== value,
                      ),
                    }
                  : group,
              ),
          ]
        : options
    return (
      <div className="min-w-0 space-y-2">
        <SelectWithSearch
          {...props}
          ref={ref}
          value={available ? saved.value : value}
          options={resolved}
          disabled={disabled || (uncertain && !allowPartialOptions)}
          searchPlaceholder={
            props.searchPlaceholder ?? t('common.modelPicker.search')
          }
        />
        {showStatus && loading ? (
          <output
            aria-live="polite"
            className="flex items-center gap-2 text-xs text-text-secondary"
          >
            <LoaderCircle aria-hidden className="size-4 animate-spin" />
            {t('common.modelPicker.loading')}
          </output>
        ) : showStatus && error ? (
          <div
            role="alert"
            className="flex items-center gap-2 text-xs text-status-error"
          >
            <AlertCircle aria-hidden className="size-4 shrink-0" />
            <span>{t('common.modelPicker.loadFailed')}</span>
            {onRetry && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void onRetry()}
              >
                {t('common.retry')}
              </Button>
            )}
          </div>
        ) : null}
      </div>
    )
  },
)
