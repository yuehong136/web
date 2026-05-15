import { useEffect, useMemo, type FC } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle } from 'lucide-react'
import {
  SelectWithSearch,
  type SelectOptionGroup,
} from '@/components/ui/select-with-search'
import { FormTooltip } from '@/components/ui/tooltip'
import { IconFontFill } from '@/components/ui/icon-font'
import {
  useModelStore,
  IconMap,
  LLMFactory,
  isLLMModelEnabled,
} from '@/stores/model'
import { useIsDarkTheme } from '@/themes'

interface EmbeddingModelSelectorProps {
  selectedModelId: string | null
  onSelect: (modelId: string | null) => void
  disabled?: boolean
  error?: string
  showLabel?: boolean
}

const THEME_AWARE_FACTORIES: string[] = [
  LLMFactory.FishAudio,
  LLMFactory.TogetherAI,
  LLMFactory.Meituan,
  LLMFactory.Longcat,
]

const getIconName = (provider: string, isDark: boolean): string => {
  const baseIcon = IconMap[provider as keyof typeof IconMap] || 'moxing-default'
  if (THEME_AWARE_FACTORIES.includes(provider)) {
    return isDark ? `${baseIcon}-dark` : `${baseIcon}-bright`
  }
  return baseIcon
}

const ModelOptionLabel: FC<{
  provider: string
  modelName: string
}> = ({ provider, modelName }) => {
  const isDark = useIsDarkTheme()
  const iconName = getIconName(provider, isDark)

  return (
    <div className="flex w-full min-w-0 items-center gap-2">
      <IconFontFill name={iconName} className="h-5 w-5 shrink-0" />
      <span className="truncate">{modelName}</span>
    </div>
  )
}

export const EmbeddingModelSelector: FC<EmbeddingModelSelectorProps> = ({
  selectedModelId,
  onSelect,
  disabled = false,
  error,
  showLabel = true,
}) => {
  const { t } = useTranslation()
  const { myLLMs, loadMyLLMs, isLoading } = useModelStore()

  useEffect(() => {
    if (Object.keys(myLLMs).length === 0) {
      loadMyLLMs()
    }
  }, [myLLMs, loadMyLLMs])

  const groupedOptions = useMemo((): SelectOptionGroup[] => {
    const groups: SelectOptionGroup[] = []

    Object.entries(myLLMs).forEach(([providerName, providerData]) => {
      const embeddingModels = providerData.llm.filter(
        (model) => model.type === 'embedding' && isLLMModelEnabled(model),
      )

      if (embeddingModels.length > 0) {
        groups.push({
          label: providerName,
          options: embeddingModels.map((model) => ({
            label: (
              <ModelOptionLabel
                provider={providerName}
                modelName={model.name}
              />
            ),
            value: `${model.name}@${providerName}`,
          })),
        })
      }
    })

    return groups
  }, [myLLMs])

  const allModelValues = useMemo(() => {
    const values: Map<string, string> = new Map()
    Object.entries(myLLMs).forEach(([providerName, providerData]) => {
      providerData.llm
        .filter(
          (model) => model.type === 'embedding' && isLLMModelEnabled(model),
        )
        .forEach((model) => {
          const fullValue = `${model.name}@${providerName}`
          values.set(fullValue.toLowerCase(), fullValue)
          values.set(model.name.toLowerCase(), fullValue)
        })
    })
    return values
  }, [myLLMs])

  const normalizedValue = useMemo(() => {
    if (!selectedModelId) return ''
    const lowerValue = selectedModelId.toLowerCase()

    if (allModelValues.has(lowerValue)) {
      return allModelValues.get(lowerValue)!
    }

    for (const [key, fullValue] of allModelValues) {
      if (
        key
          .replace(/-/g, '')
          .includes(lowerValue.replace(/-/g, '').replace(/@.*$/, ''))
      ) {
        return fullValue
      }
    }
    return selectedModelId
  }, [selectedModelId, allModelValues])

  const hasModels = groupedOptions.length > 0
  const label = t('knowledge.embeddingSelector.label')

  if (isLoading) {
    return (
      <div className="space-y-2">
        {showLabel && (
          <div className="block text-sm font-medium text-text-primary">
            {label}
          </div>
        )}
        <div className="bg-surface-secondary/50 flex h-10 w-full items-center rounded-md border border-border-default px-3 py-2">
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
        <div className="border-status-error bg-status-error/10 flex h-10 w-full items-center rounded-md border px-3 py-2">
          <AlertCircle className="text-status-error h-3 w-3" />
          <span className="text-status-error ml-2 text-sm">{error}</span>
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
        <div className="border-status-warning bg-status-warning/10 flex h-10 w-full items-center rounded-md border px-3 py-2">
          <AlertCircle className="text-status-warning h-3 w-3" />
          <span className="text-status-warning ml-2 text-sm">
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
