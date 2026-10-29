import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  DiscoveredModel,
  ModelDiscoveryPage,
} from '@/api/llm-provider-types'
import { ModelCapabilities } from '@/components/models/model-capabilities'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'

interface Props {
  page: ModelDiscoveryPage
  selected: ReadonlyMap<string, DiscoveredModel>
  pending: boolean
  changeSelection: (selection: Map<string, DiscoveredModel>) => void
  changePage: (number: number) => void
}

export function DiscoveredModelPicker({
  page,
  selected,
  pending,
  changeSelection,
  changePage,
}: Props) {
  const { t } = useTranslation()
  const id = useId()
  const [query, setQuery] = useState('')
  const normalized = query.trim().toLowerCase()
  const models = page.items.filter((model) =>
    `${model.display_name} ${model.model_name}`
      .toLowerCase()
      .includes(normalized),
  )
  const additions = models.filter((model) => !selected.has(model.model_name))
  return (
    <fieldset disabled={pending} className="flex flex-col gap-space-sm">
      <legend className="sr-only">{t('settings.models.discovery.find')}</legend>
      {(page.items.length > 10 || query) && (
        <Input
          type="search"
          aria-label={t('settings.models.discovery.searchPage')}
          placeholder={t('settings.models.discovery.searchPage')}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      )}
      <div className="flex flex-wrap gap-space-sm">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!additions.length || selected.size + additions.length > 100}
          onClick={() => {
            const next = new Map(selected)
            for (const model of models) next.set(model.model_name, model)
            changeSelection(next)
          }}
        >
          {t('settings.models.discovery.selectPage')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!selected.size}
          onClick={() => changeSelection(new Map())}
        >
          {t('settings.models.discovery.clearSelection')}
        </Button>
      </div>
      {models.length ? (
        <ul className="max-h-64 overflow-auto rounded-radius-md border border-border-default">
          {models.map((model) => (
            <li
              key={model.model_name}
              className="border-b border-border-subtle p-space-sm last:border-0"
            >
              <label
                htmlFor={`${id}-${encodeURIComponent(model.model_name)}`}
                className="flex cursor-pointer items-start gap-space-sm"
              >
                <Checkbox
                  id={`${id}-${encodeURIComponent(model.model_name)}`}
                  aria-label={model.display_name}
                  checked={selected.has(model.model_name)}
                  disabled={
                    !selected.has(model.model_name) && selected.size >= 100
                  }
                  onCheckedChange={(checked) => {
                    const next = new Map(selected)
                    if (checked === true) next.set(model.model_name, model)
                    else next.delete(model.model_name)
                    changeSelection(next)
                  }}
                />
                <span className="min-w-0 text-sm break-words">
                  <span className="block font-medium">
                    {model.display_name}
                  </span>
                  <span className="block text-xs text-text-secondary">
                    {model.model_name}
                  </span>
                  <ModelCapabilities
                    types={model.model_types}
                    tools={model.is_tools}
                  />
                  {model.features.includes('thinking') && (
                    <span className="block text-xs text-text-secondary">
                      {t('settings.models.discovery.thinking')}
                    </span>
                  )}
                </span>
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <output className="text-sm text-text-secondary">
          {t('common.noResults')}
        </output>
      )}
      {page.total > page.page_size && (
        <nav
          aria-label={t('settings.models.discovery.pagination')}
          className="flex items-center justify-between gap-space-sm"
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page.page <= 1}
            onClick={() => changePage(page.page - 1)}
          >
            {t('settings.models.discovery.previous')}
          </Button>
          <span className="text-sm text-text-secondary">
            {page.page} / {Math.ceil(page.total / page.page_size)}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page.page * page.page_size >= page.total}
            onClick={() => changePage(page.page + 1)}
          >
            {t('common.next')}
          </Button>
        </nav>
      )}
    </fieldset>
  )
}
