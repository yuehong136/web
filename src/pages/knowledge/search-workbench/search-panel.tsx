import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Loader2,
  Search,
  SendHorizontal,
  Settings as SettingsIcon,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface SearchPanelProps {
  query: string
  isSearching: boolean
  searchModeLabel: string
  activeConfigBadges: string[]
  onQueryChange: (value: string) => void
  onSearch: () => void
  onOpenConfig: () => void
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
  query,
  isSearching,
  searchModeLabel,
  activeConfigBadges,
  onQueryChange,
  onSearch,
  onOpenConfig,
}) => {
  const { t } = useTranslation()

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden p-space-lg">
      <div className="flex items-start justify-between gap-space-base pb-space-lg">
        <div className="flex items-start gap-space-sm">
          <Search className="mt-1 h-5 w-5 text-accent-fg" />
          <div>
            <h2 className="text-base font-semibold text-fg">
              {t('knowledge.search.queryTitle')}
            </h2>
            <p className="mt-1 text-xs text-fg-subtle">
              {t('knowledge.search.queryDescription')}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenConfig}
          className="shrink-0"
        >
          <SettingsIcon className="h-4 w-4" />
          {searchModeLabel}
        </Button>
      </div>

      <div className="min-h-0 flex-1">
        <div className="space-y-space-sm">
          <label className="block text-sm font-medium text-fg">
            {t('knowledge.search.queryLabel')}
          </label>
          <div className="relative rounded-radius-lg border border-line bg-surface transition-colors focus-within:border-line-focus">
            <Textarea
              variant="chat"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  onSearch()
                }
              }}
              placeholder={t('knowledge.search.queryPlaceholder')}
              className="h-[200px] resize-none px-space-base py-space-base pb-space-2xl leading-relaxed"
            />
            <span className="absolute right-space-2xl bottom-space-sm left-space-base truncate pr-space-md text-xs text-fg-subtle">
              {t('knowledge.search.chars', { count: query.length })}
              <span className="ml-space-sm hidden md:inline">
                {t('knowledge.search.searchShortcut')}
              </span>
            </span>
            <Button
              type="button"
              onClick={onSearch}
              disabled={!query.trim() || isSearching}
              size="icon-sm"
              aria-label={t('knowledge.search.startSearch')}
              title={t('knowledge.search.startSearch')}
              className="absolute right-space-sm bottom-space-sm"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SendHorizontal className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="mt-space-xl border-t border-line pt-space-base">
          <div className="mb-space-sm flex items-center justify-between">
            <h3 className="text-sm font-medium text-fg">
              {t('knowledge.search.advancedParams')}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenConfig}
              className="h-7 px-space-xs text-xs"
            >
              {t('knowledge.search.settings')}
            </Button>
          </div>
          <div className="flex flex-wrap gap-space-xs">
            {activeConfigBadges.map((badge) => (
              <Badge
                key={badge}

                className="text-xs font-normal"
              >
                {badge}
              </Badge>
            ))}
          </div>
          <p className="mt-space-sm text-xs text-fg-subtle">
            {t('knowledge.search.adjustTip')}
          </p>
        </div>
      </div>
    </section>
  )
}
