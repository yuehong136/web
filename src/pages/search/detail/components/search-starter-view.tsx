import { memo } from 'react'
import { ArrowRight, FileSearch, Files, ListChecks } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
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

// Start paths in the EmptyStart card style; static tint classes for Tailwind.
const STARTERS = [
  {
    key: 'summarize',
    Icon: ListChecks,
    tone: 'bg-avatar-5-bg text-avatar-5-fg',
  },
  {
    key: 'locate',
    Icon: FileSearch,
    tone: 'bg-avatar-6-bg text-avatar-6-fg',
  },
  {
    key: 'compare',
    Icon: Files,
    tone: 'bg-avatar-7-bg text-avatar-7-fg',
  },
] as const

/** A new session: the question, the composer as the hero, three start paths. */
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
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-center gap-space-xl py-space-xl">
      <div className="flex flex-col items-center gap-space-sm text-center">
        <h1 className="text-2xl leading-tight font-semibold tracking-tight text-pretty text-fg sm:text-3xl">
          {t('searchPage.workspace.starterTitle')}
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-pretty text-fg-muted sm:text-base">
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
      <ul className="grid w-full grid-cols-[repeat(auto-fit,minmax(min(13.75rem,100%),1fr))] gap-space-sm">
        {STARTERS.map(({ key, Icon, tone }) => (
          <li key={key} className="min-w-0">
            <button
              type="button"
              onClick={() =>
                onPrefill(t(`searchPage.workspace.starters.${key}.query`))
              }
              className="flex h-full w-full flex-col items-start gap-space-sm rounded-radius-xl border border-line bg-surface p-space-md text-left outline-hidden transition-[border-color,box-shadow,transform] duration-(--motion-fast) hover:border-line-strong hover:shadow-elevation-medium focus-visible:ring-2 focus-visible:ring-line-focus motion-safe:hover:-translate-y-0.5"
            >
              <span
                className={cn(
                  'flex size-9 items-center justify-center rounded-radius-lg',
                  tone,
                )}
              >
                <Icon className="size-icon-md" aria-hidden="true" />
              </span>
              <span className="flex flex-col gap-space-2xs">
                <span className="text-sm font-semibold text-fg">
                  {t(`searchPage.workspace.starters.${key}.title`)}
                </span>
                <span className="text-xs leading-relaxed text-fg-subtle">
                  {t(`searchPage.workspace.starters.${key}.description`)}
                </span>
              </span>
              <span className="mt-auto flex items-center gap-space-2xs text-xs font-medium text-accent-fg">
                {t('searchPage.workspace.starterCta')}
                <ArrowRight aria-hidden="true" className="size-3.5" />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default memo(SearchStarterView)
