import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  SlidersHorizontal,
} from 'lucide-react'
import {
  AppScene,
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
  PageToolbar,
} from '@/components/patterns'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { QueryObserverResult } from '@tanstack/react-query'
import type { AgentSessionListResponse } from '@/types/agent'
import type { ExploreSession, ExploreSessionListParams } from '../types'
import { SessionCard } from './session-card'

interface SessionRailProps {
  sessions: ExploreSession[]
  params: ExploreSessionListParams
  total: number
  selectedSessionId: string
  isNew: boolean
  loading: boolean
  error: boolean
  deleting?: boolean
  onChangeParams: (patch: Partial<ExploreSessionListParams>) => void
  onSelectSession: (sessionId?: string, isNew?: boolean) => void
  onCreateSession: () => void
  onDeleteSession: (session: ExploreSession) => void
  onRetry: () => Promise<QueryObserverResult<AgentSessionListResponse, Error>>
}

export function SessionRail({
  sessions,
  params,
  total,
  selectedSessionId,
  isNew,
  loading,
  error,
  deleting,
  onChangeParams,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onRetry,
}: SessionRailProps) {
  const { t } = useTranslation()
  const advancedFilterCount = [
    Boolean(params.from_date),
    Boolean(params.to_date),
    params.orderby !== 'update_time',
    !params.desc,
  ].filter(Boolean).length
  const hasFilters = Boolean(params.keywords?.trim()) || advancedFilterCount > 0
  const hasResultFilters = Boolean(
    params.keywords?.trim() || params.from_date || params.to_date,
  )
  const [filtersOpen, setFiltersOpen] = useState(advancedFilterCount > 0)
  const totalPages = Math.max(1, Math.ceil(total / params.page_size))
  const savedSessionCount = sessions.filter(
    (session) => !session.isTemporary,
  ).length
  const clearFilters = () =>
    onChangeParams({
      keywords: '',
      from_date: '',
      to_date: '',
      orderby: 'update_time',
      desc: true,
      page: 1,
    })

  return (
    <aside
      className="flex h-full min-h-0 flex-col gap-space-md p-space-base"
      aria-label={t('agent.explore.history')}
    >
      <PageToolbar
        className="hidden border-0 px-space-xs py-space-xs md:flex"
        left={
          <h2 className="text-sm font-semibold text-text-secondary">
            {t('agent.explore.history')}
          </h2>
        }
      />
      <Button type="button" className="w-full" onClick={onCreateSession}>
        <Plus className="size-icon-sm" aria-hidden="true" />
        {t('agent.explore.newChat')}
      </Button>

      <Input
        inputSize="sm"
        value={params.keywords || ''}
        leftIcon={<Search className="size-icon-sm" aria-hidden="true" />}
        aria-label={t('agent.explore.searchChats')}
        placeholder={t('agent.explore.searchChats')}
        onChange={(event) => onChangeParams({ keywords: event.target.value })}
      />

      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <div className="flex items-center justify-between gap-space-sm">
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="px-space-xs text-xs text-text-secondary"
            >
              <SlidersHorizontal className="size-icon-sm" aria-hidden="true" />
              {t('agent.explore.filterAndSort')}
              {advancedFilterCount > 0 ? (
                <span className="rounded-radius-full bg-state-focus-10 px-space-xs text-text-accent">
                  {advancedFilterCount}
                </span>
              ) : null}
              <ChevronDown
                className={
                  filtersOpen ? 'size-icon-sm rotate-180' : 'size-icon-sm'
                }
                aria-hidden="true"
              />
            </Button>
          </CollapsibleTrigger>
          {hasFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="px-space-xs text-xs text-text-secondary"
              onClick={clearFilters}
            >
              {t('agent.explore.clearFilters')}
            </Button>
          ) : null}
        </div>
        <CollapsibleContent className="space-y-space-sm pt-space-base pb-space-sm">
          <div className="grid grid-cols-2 gap-space-sm">
            <Input
              inputSize="sm"
              type="date"
              label={t('agent.explore.fromDate')}
              value={params.from_date || ''}
              onChange={(event) =>
                onChangeParams({ from_date: event.target.value })
              }
            />
            <Input
              inputSize="sm"
              type="date"
              label={t('agent.explore.toDate')}
              value={params.to_date || ''}
              onChange={(event) =>
                onChangeParams({ to_date: event.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-space-sm">
            <Select
              value={params.orderby}
              onValueChange={(value) => onChangeParams({ orderby: value })}
            >
              <SelectTrigger
                className="rounded-radius-md"
                aria-label={t('agent.explore.sortField')}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="update_time">
                  {t('agent.explore.updatedAt')}
                </SelectItem>
                <SelectItem value="create_time">
                  {t('agent.explore.createdAt')}
                </SelectItem>
                <SelectItem value="name">{t('agent.explore.name')}</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={params.desc ? 'desc' : 'asc'}
              onValueChange={(value) =>
                onChangeParams({ desc: value === 'desc' })
              }
            >
              <SelectTrigger
                className="rounded-radius-md"
                aria-label={t('agent.explore.sortDirection')}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">
                  {t('agent.explore.descending')}
                </SelectItem>
                <SelectItem value="asc">
                  {t('agent.explore.ascending')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="min-h-0 flex-1" aria-busy={loading}>
        <ScrollArea className="h-full">
          <div className="space-y-space-xs">
            {sessions.map((session) => (
              <SessionCard
                key={`${session.id}-${session.isTemporary ? 'temporary' : 'server'}`}
                session={session}
                selected={
                  session.isTemporary
                    ? isNew && !selectedSessionId
                    : selectedSessionId === session.id
                }
                disabled={deleting}
                onSelect={() =>
                  onSelectSession(
                    session.isTemporary ? undefined : session.id,
                    Boolean(session.isTemporary),
                  )
                }
                onDelete={() => onDeleteSession(session)}
              />
            ))}
          </div>
          {loading && savedSessionCount === 0 ? (
            <PageLoadingState
              scene={AppScene.SPLIT_DETAIL}
              compact
              title={t('agent.explore.historyLoading')}
              description={t('agent.explore.historyLoadingDescription')}
            />
          ) : error ? (
            <PageErrorState
              scene={AppScene.SPLIT_DETAIL}
              compact
              title={t('agent.explore.historyLoadFailed')}
              description={t('agent.explore.historyLoadFailedDescription')}
              retryLabel={t('agent.explore.retry')}
              onRetry={() => {
                void onRetry()
              }}
            />
          ) : savedSessionCount === 0 ? (
            <PageEmptyState
              scene={AppScene.SPLIT_DETAIL}
              compact
              title={t(
                hasResultFilters
                  ? 'agent.explore.noMatchingChats'
                  : 'agent.explore.noSavedChats',
              )}
              description={t(
                hasResultFilters
                  ? 'agent.explore.noMatchingChatsDescription'
                  : 'agent.explore.noSavedChatsDescription',
              )}
              icon={
                hasResultFilters ? (
                  <Search className="size-icon-lg" aria-hidden="true" />
                ) : undefined
              }
              action={
                hasResultFilters ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                  >
                    {t('agent.explore.clearFilters')}
                  </Button>
                ) : undefined
              }
            />
          ) : null}
        </ScrollArea>
      </div>

      {total > 0 ? (
        <div className="flex items-center justify-between gap-space-sm border-t border-border-subtle pt-space-sm">
          <p className="text-xs text-text-tertiary">
            {t('agent.explore.paginationLabel', {
              count: total,
              page: params.page,
              pages: totalPages,
            })}
          </p>
          <div className="flex items-center gap-space-xs">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={params.page <= 1 || loading}
              aria-label={t('agent.explore.previousPage')}
              onClick={() => onChangeParams({ page: params.page - 1 })}
            >
              <ChevronLeft className="size-icon-sm" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={params.page >= totalPages || loading}
              aria-label={t('agent.explore.nextPage')}
              onClick={() => onChangeParams({ page: params.page + 1 })}
            >
              <ChevronRight className="size-icon-sm" aria-hidden="true" />
            </Button>
          </div>
        </div>
      ) : null}
    </aside>
  )
}
