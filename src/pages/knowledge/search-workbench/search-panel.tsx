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
    <section className="p-space-lg flex h-full min-h-0 flex-col overflow-hidden">
      <div className="gap-space-base pb-space-lg flex items-start justify-between">
        <div className="gap-space-sm flex items-start">
          <Search className="mt-1 h-5 w-5 text-text-accent" />
          <div>
            <h2 className="text-base font-semibold text-text-primary">
              {t('knowledge.search.queryTitle')}
            </h2>
            <p className="mt-1 text-xs text-text-tertiary">
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
          <label className="block text-sm font-medium text-text-primary">
            {t('knowledge.search.queryLabel')}
          </label>
          <div className="rounded-radius-lg relative border border-components-input-border bg-background-surface transition-colors focus-within:border-components-input-border-focus">
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
              className="px-space-base py-space-base pb-space-2xl h-[200px] resize-none leading-relaxed"
            />
            <span className="bottom-space-sm left-space-base right-space-2xl pr-space-md absolute truncate text-xs text-text-tertiary">
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
              className="bottom-space-sm right-space-sm absolute"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SendHorizontal className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="mt-space-xl pt-space-base border-t border-border-default">
          <div className="mb-space-sm flex items-center justify-between">
            <h3 className="text-sm font-medium text-text-primary">
              {t('knowledge.search.advancedParams')}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenConfig}
              className="px-space-xs h-7 text-xs"
            >
              {t('knowledge.search.settings')}
            </Button>
          </div>
          <div className="gap-space-xs flex flex-wrap">
            {activeConfigBadges.map((badge) => (
              <Badge
                key={badge}
                variant="secondary"
                className="text-xs font-normal"
              >
                {badge}
              </Badge>
            ))}
          </div>
          <p className="mt-space-sm text-xs text-text-tertiary">
            {t('knowledge.search.adjustTip')}
          </p>
        </div>
      </div>
    </section>
  )
}
