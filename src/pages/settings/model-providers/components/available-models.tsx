import { useEffect, useState, useMemo, type FC } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useFetchFactories, useFetchMyLLMs } from '@/hooks/use-llm-request'
import { ProviderLogo } from '@/components/patterns/provider-logo'
import { SettingRow, SettingSection } from '@/components/patterns/setting-row'
import { cn } from '@/lib/utils'
import {
  ModelCapabilities,
  ModelCapability,
} from '@/components/models/model-capabilities'

import {
  availableModelFilters,
  sortProviderTags,
} from './available-model-filters'

const PROVIDER_SEARCH_ID = 'model-provider-search'

interface AvailableModelsProps {
  handleAddModel: (factoryName: string) => void
  /** Each increment focuses the search box ("Connect provider", "Browse all"). */
  focusSearchRequest?: number
}

export const AvailableModels: FC<AvailableModelsProps> = ({
  handleAddModel,
  focusSearchRequest = 0,
}) => {
  const { t } = useTranslation()
  useEffect(() => {
    if (focusSearchRequest) document.getElementById(PROVIDER_SEARCH_ID)?.focus()
  }, [focusSearchRequest])
  const { factories } = useFetchFactories()
  const { myLLMs } = useFetchMyLLMs()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const {
    allTags,
    searched,
    filtered: filteredModels,
    counts,
  } = useMemo(
    () =>
      availableModelFilters(
        factories,
        Object.keys(myLLMs),
        searchTerm,
        selectedTags,
      ),
    [factories, myLLMs, searchTerm, selectedTags],
  )

  const handleTagClick = (tag: string) => {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag],
    )
  }

  const chip = (pressed: boolean) =>
    cn(
      'inline-flex min-h-[var(--control-height-sm)] items-center gap-space-xs rounded-radius-sm border px-space-sm text-xs outline-hidden transition-colors focus-visible:ring-2 focus-visible:ring-state-focus',
      pressed
        ? 'border-border-strong bg-state-selected-bg text-text-primary'
        : 'border-border-default text-text-secondary hover:bg-state-hover',
    )

  return (
    <SettingSection
      title={t('settings.models.available')}
      description={t('settings.models.filterCapabilitiesHint')}
    >
      <div className="flex flex-col gap-space-sm pb-space-sm">
        <Input
          id={PROVIDER_SEARCH_ID}
          type="search"
          inputSize="sm"
          className="sm:w-64"
          aria-label={t('settings.models.searchProviders')}
          placeholder={t('common.search')}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          leftIcon={<Search aria-hidden className="size-icon-sm" />}
        />
        <fieldset
          aria-label={t('settings.models.filterCapabilities')}
          className="flex flex-wrap gap-space-xs"
        >
          <button
            type="button"
            aria-pressed={selectedTags.length === 0}
            onClick={() => setSelectedTags([])}
            className={chip(selectedTags.length === 0)}
          >
            {t('settings.models.allProviders')}{' '}
            <span className="text-text-tertiary tabular-nums">
              {searched.length}
            </span>
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              aria-pressed={selectedTags.includes(tag)}
              onClick={() => handleTagClick(tag)}
              className={chip(selectedTags.includes(tag))}
            >
              <ModelCapability type={tag} />{' '}
              <span className="text-text-tertiary tabular-nums">
                {counts.get(tag) ?? 0}
              </span>
            </button>
          ))}
        </fieldset>
      </div>
      {filteredModels.length === 0 ? (
        <p className="border-t border-border-subtle py-space-lg text-center text-sm text-text-tertiary">
          {t('common.noResults')}
        </p>
      ) : (
        filteredModels.map((factory) => (
          <SettingRow
            key={factory.id}
            leading={<ProviderLogo provider={factory.name} size="md" />}
            label={
              <>
                <span className="block truncate">{factory.name}</span>
                <ModelCapabilities
                  types={sortProviderTags(factory.tags)}
                  className="mt-space-2xs font-normal"
                />
              </>
            }
          >
            <Button
              variant="outline"
              size="sm"
              aria-label={t('settings.models.addProviderNamed', {
                name: factory.name,
              })}
              leftIcon={<Plus aria-hidden className="size-icon-sm" />}
              onClick={() => handleAddModel(factory.name)}
            >
              {t('common.add')}
            </Button>
          </SettingRow>
        ))
      )}
    </SettingSection>
  )
}
