import { useId, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Search } from 'lucide-react'
import { ProviderLogo } from '@/components/patterns/provider-logo'
import { Input } from '@/components/ui/input'
import { useFetchFactories, useFetchMyLLMs } from '@/hooks/use-llm-request'
import { availableModelFilters } from './available-model-filters'

/** Tiles before "Browse all"; two rows on a wide column. */
const PREVIEW_COUNT = 7

/**
 * Providers that can still be connected, as a searchable logo grid. A tile
 * opens the connect dialog; "Browse all" opens the full catalog with
 * capability filters on the Providers tab.
 */
export function ProviderCatalog({
  onConnect,
  onBrowseAll,
}: {
  onConnect: (provider: string) => void
  onBrowseAll: () => void
}) {
  const { t } = useTranslation()
  const headingId = useId()
  const { factories } = useFetchFactories()
  const { myLLMs } = useFetchMyLLMs()
  const [search, setSearch] = useState('')
  const { searched } = useMemo(
    () => availableModelFilters(factories, Object.keys(myLLMs), search, []),
    [factories, myLLMs, search],
  )
  const total = useMemo(
    () => availableModelFilters(factories, Object.keys(myLLMs), '', []),
    [factories, myLLMs],
  ).searched.length
  if (!total) return null
  const shown = searched.slice(0, PREVIEW_COUNT)
  return (
    <section
      aria-labelledby={headingId}
      data-slot="provider-catalog"
      className="mt-space-xl flex flex-col gap-space-sm"
    >
      <div className="flex flex-wrap items-center gap-x-space-sm gap-y-space-xs">
        <h2 id={headingId} className="text-sm font-semibold text-text-primary">
          {t('settings.models.canConnect')}
        </h2>
        <span className="text-xs text-text-tertiary tabular-nums">
          {t('settings.models.providerCount', { count: total })}
        </span>
        <span className="flex-1" aria-hidden="true" />
        <Input
          type="search"
          inputSize="sm"
          className="w-full sm:w-52"
          aria-label={t('settings.models.searchProviders')}
          placeholder={t('settings.models.searchProvidersShort')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          leftIcon={<Search aria-hidden className="size-icon-sm" />}
        />
      </div>
      <ul
        aria-labelledby={headingId}
        className="grid grid-cols-[repeat(auto-fill,minmax(min(12.5rem,100%),1fr))] gap-space-sm"
      >
        {shown.map((factory) => (
          <li key={factory.name} className="min-w-0">
            <button
              type="button"
              aria-label={t('settings.models.connectNamed', {
                name: factory.name,
              })}
              onClick={() => onConnect(factory.name)}
              className="group flex h-full w-full min-w-0 items-center gap-space-sm rounded-radius-lg border border-border-subtle bg-components-card-bg px-space-sm py-space-sm text-left outline-hidden transition-[border-color,box-shadow] duration-150 hover:border-border-strong hover:shadow-elevation-low focus-visible:ring-2 focus-visible:ring-state-focus"
            >
              <ProviderLogo provider={factory.name} size="md" />
              <span className="min-w-0 flex-1 truncate text-sm text-text-primary">
                {factory.name}
              </span>
              <span className="shrink-0 text-xs text-text-accent group-hover:underline">
                {t('settings.models.connect')}
              </span>
            </button>
          </li>
        ))}
        <li className="min-w-0">
          <button
            type="button"
            onClick={onBrowseAll}
            className="flex h-full min-h-11 w-full items-center justify-center gap-space-xs rounded-radius-lg border border-dashed border-border-default px-space-sm py-space-sm text-sm text-text-secondary outline-hidden transition-colors hover:bg-state-hover hover:text-text-primary focus-visible:ring-2 focus-visible:ring-state-focus"
          >
            {t('settings.models.browseAll', { count: total })}
            <ArrowRight aria-hidden className="size-icon-sm" />
          </button>
        </li>
      </ul>
      {searched.length === 0 ? (
        <p className="text-sm text-text-tertiary">{t('common.noResults')}</p>
      ) : null}
    </section>
  )
}
