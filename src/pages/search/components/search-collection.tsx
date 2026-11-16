import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Clock,
  Database,
  MoreHorizontal,
  Settings,
  Sparkles,
  Trash2,
  Workflow,
} from 'lucide-react'
import {
  FilterBar,
  ResourceCard,
  ResourceGrid,
  ResourceList,
  ResourceListHeader,
  ResourceRow,
  type CollectionView,
  type FilterDefinition,
  type ResourceItemProps,
} from '@/components/patterns'
import {
  ActionMenu,
  ActionMenuContent,
  ActionMenuItem,
  ActionMenuSeparator,
  ActionMenuTrigger,
} from '@/components/ui/action-menu'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { SearchAppListItem } from '@/types/search'
import {
  formatSearchTime,
  resolveKbCount,
  resolveRelatedEnabled,
  resolveSummaryEnabled,
  type SearchTimeFormat,
} from './utils'

export type SearchSortBy = 'update_time' | 'create_time' | 'name'
export type SearchFeatureFilters = { summary: string[]; related: string[] }

interface SearchFilterBarProps {
  keyword: string
  onKeywordChange: (value: string) => void
  filters: SearchFeatureFilters
  onFiltersChange: (filters: SearchFeatureFilters) => void
  sortBy: SearchSortBy
  onSortByChange: (value: SearchSortBy) => void
  sortDesc: boolean
  onSortDescChange: (desc: boolean) => void
  timeFormat: SearchTimeFormat
  onTimeFormatChange: (value: SearchTimeFormat) => void
  view: CollectionView
  onViewChange: (view: CollectionView) => void
}

/** Search, AI summary / related chips, one sort and display menu, view. */
export function SearchFilterBar({
  keyword,
  onKeywordChange,
  filters,
  onFiltersChange,
  sortBy,
  onSortByChange,
  sortDesc,
  onSortDescChange,
  timeFormat,
  onTimeFormatChange,
  view,
  onViewChange,
}: SearchFilterBarProps) {
  const { t } = useTranslation()
  const toggleOptions = [
    { value: 'enabled', label: t('searchPage.filters.enabled') },
    { value: 'disabled', label: t('searchPage.filters.disabled') },
  ]
  const chips: FilterDefinition[] = [
    {
      key: 'summary',
      label: t('searchPage.filters.summary'),
      value: filters.summary,
      options: toggleOptions,
    },
    {
      key: 'related',
      label: t('searchPage.filters.related'),
      value: filters.related,
      options: toggleOptions,
    },
  ]
  return (
    <FilterBar
      search={{
        value: keyword,
        onChange: onKeywordChange,
        placeholder: t('searchPage.toolbar.searchPlaceholder'),
      }}
      filters={chips}
      onFilterChange={(key, value) =>
        onFiltersChange({ ...filters, [key]: value })
      }
      onClearFilters={() => onFiltersChange({ summary: [], related: [] })}
      sort={{
        value: sortBy,
        onChange: (value) => onSortByChange(value as SearchSortBy),
        options: [
          { value: 'update_time', label: t('searchPage.toolbar.sortUpdated') },
          { value: 'create_time', label: t('searchPage.toolbar.sortCreated') },
          { value: 'name', label: t('searchPage.toolbar.sortName') },
        ],
      }}
      display={[
        {
          key: 'order',
          label: t('searchPage.toolbar.order'),
          value: sortDesc ? 'desc' : 'asc',
          onChange: (value) => onSortDescChange(value === 'desc'),
          options: [
            { value: 'desc', label: t('searchPage.toolbar.descending') },
            { value: 'asc', label: t('searchPage.toolbar.ascending') },
          ],
        },
        {
          key: 'time',
          label: t('searchPage.toolbar.timeFormat'),
          value: timeFormat,
          onChange: (value) => onTimeFormatChange(value as SearchTimeFormat),
          options: [
            { value: 'detailed', label: t('searchPage.toolbar.detailedTime') },
            { value: 'compact', label: t('searchPage.toolbar.compactTime') },
            { value: 'relative', label: t('searchPage.toolbar.relativeTime') },
          ],
        },
      ]}
      view={{ value: view, onChange: onViewChange }}
    />
  )
}

/** Page-scoped feature counts for the footer note. */
export function countSearchFeatures(apps: SearchAppListItem[]) {
  return {
    summary: apps.filter(resolveSummaryEnabled).length,
    related: apps.filter(resolveRelatedEnabled).length,
  }
}

function KnowledgeStatus({ app }: { app: SearchAppListItem }) {
  const { t } = useTranslation()
  const count = resolveKbCount(app)
  // Without a knowledge base a search app retrieves nothing.
  if (!count)
    return <Badge variant="warning">{t('searchPage.card.noKnowledge')}</Badge>
  return (
    <span className="inline-flex items-center gap-space-xs text-xs text-text-tertiary">
      <Database className="size-icon-xs shrink-0" aria-hidden="true" />
      {t('searchPage.card.knowledgeBases', { count })}
    </span>
  )
}

/** AI summary / related questions and the update time. */
function SearchMeta({
  app,
  timeFormat,
  compact = false,
}: {
  app: SearchAppListItem
  timeFormat: SearchTimeFormat
  compact?: boolean
}) {
  const { t } = useTranslation()
  const summary = t(
    resolveSummaryEnabled(app)
      ? 'searchPage.card.summaryOn'
      : 'searchPage.card.summaryOff',
  )
  const related = t(
    resolveRelatedEnabled(app)
      ? 'searchPage.card.relatedOn'
      : 'searchPage.card.relatedOff',
  )
  const feature = (label: string, enabled: boolean, icon: ReactNode) =>
    compact ? (
      enabled ? (
        <span className="inline-flex items-center" title={label}>
          {icon}
          <span className="sr-only">{label}</span>
        </span>
      ) : null
    ) : (
      <span className="inline-flex items-center gap-space-xs">
        {icon}
        {label}
      </span>
    )
  return (
    <>
      {feature(
        summary,
        resolveSummaryEnabled(app),
        <Sparkles className="size-icon-xs shrink-0" aria-hidden="true" />,
      )}
      {feature(
        related,
        resolveRelatedEnabled(app),
        <Workflow className="size-icon-xs shrink-0" aria-hidden="true" />,
      )}
      <span className="inline-flex min-w-0 items-center gap-space-xs">
        <Clock className="size-icon-xs shrink-0" aria-hidden="true" />
        <time className="truncate">
          {formatSearchTime(app.update_time, timeFormat)}
        </time>
      </span>
    </>
  )
}

interface SearchAppCollectionProps {
  apps: SearchAppListItem[]
  view: CollectionView
  timeFormat: SearchTimeFormat
  onOpen: (id: string) => void
  onDelete: (app: SearchAppListItem) => void
}

/** The current page of search apps as rows or cards. */
export function SearchAppCollection({
  apps,
  view,
  timeFormat,
  onOpen,
  onDelete,
}: SearchAppCollectionProps) {
  const { t } = useTranslation()
  const item = (app: SearchAppListItem): ResourceItemProps => ({
    name: app.name,
    description: app.description || undefined,
    avatar: { src: app.avatar, seed: app.id },
    status: <KnowledgeStatus app={app} />,
    onOpen: () => onOpen(app.id),
    actions: (
      <ActionMenu>
        <ActionMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t('searchPage.card.actionsFor', { name: app.name })}
          >
            <MoreHorizontal className="size-icon-sm" aria-hidden="true" />
          </Button>
        </ActionMenuTrigger>
        <ActionMenuContent align="end">
          <ActionMenuItem onSelect={() => onOpen(app.id)}>
            <Settings className="size-icon-sm" aria-hidden="true" />
            {t('searchPage.card.settings')}
          </ActionMenuItem>
          <ActionMenuSeparator />
          <ActionMenuItem danger onSelect={() => onDelete(app)}>
            <Trash2 className="size-icon-sm" aria-hidden="true" />
            {t('searchPage.card.delete')}
          </ActionMenuItem>
        </ActionMenuContent>
      </ActionMenu>
    ),
  })

  if (view === 'grid')
    return (
      <ResourceGrid label={t('searchPage.title')}>
        {apps.map((app) => (
          <ResourceCard
            key={app.id}
            {...item(app)}
            meta={<SearchMeta app={app} timeFormat={timeFormat} />}
          />
        ))}
      </ResourceGrid>
    )
  return (
    <ResourceList
      label={t('searchPage.title')}
      header={
        <ResourceListHeader
          name={t('common.name')}
          status={t('searchPage.columns.knowledge')}
          meta={t('common.updateTime')}
        />
      }
    >
      {apps.map((app) => (
        <ResourceRow
          key={app.id}
          {...item(app)}
          meta={<SearchMeta app={app} timeFormat={timeFormat} compact />}
        />
      ))}
    </ResourceList>
  )
}
