import { memo } from 'react'
import { FileSearch, Files, ListChecks } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import SearchComposer from './search-composer'

interface SearchStarterViewProps {
  isSearching: boolean
  prefillText: string
  prefillVersion: number
  draft: string
  onDraftChange: (value: string) => void
  onSearch: (query: string) => void
  onStop: () => void
  onPrefill: (query: string) => void
}

function SearchStarterView({
  isSearching,
  prefillText,
  prefillVersion,
  draft,
  onDraftChange,
  onSearch,
  onStop,
  onPrefill,
}: SearchStarterViewProps) {
  const { t } = useTranslation()
  return (
    <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col justify-center gap-space-xl py-space-xl">
      <div className="space-y-space-base">
        <h1 className="text-3xl leading-tight font-semibold tracking-tight text-text-primary">
          {t('searchPage.workspace.starterTitle')}
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-text-secondary">
          {t('searchPage.workspace.starterDescription')}
        </p>
      </div>
      <SearchComposer
        variant="hero"
        onSearch={onSearch}
        onStop={onStop}
        isSearching={isSearching}
        prefillText={prefillText}
        prefillVersion={prefillVersion}
        value={draft}
        onValueChange={onDraftChange}
      />
      <div className="grid grid-cols-1 gap-space-sm border-t border-border-subtle pt-space-lg sm:grid-cols-3">
        {(
          [
            ['summarize', ListChecks],
            ['locate', FileSearch],
            ['compare', Files],
          ] as const
        ).map(([key, Icon]) => (
          <button
            key={key}
            type="button"
            onClick={() =>
              onPrefill(t(`searchPage.workspace.starters.${key}.query`))
            }
            className="group flex items-start gap-space-base rounded-radius-lg p-space-base text-left transition-colors hover:bg-state-hover focus-visible:ring-2 focus-visible:ring-state-focus focus-visible:outline-hidden"
          >
            <Icon className="mt-space-xs size-icon-md shrink-0 text-text-secondary" />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-text-primary">
                {t(`searchPage.workspace.starters.${key}.title`)}
              </span>
              <span className="mt-space-xs block text-xs leading-relaxed text-text-secondary">
                {t(`searchPage.workspace.starters.${key}.description`)}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default memo(SearchStarterView)
