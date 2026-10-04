import { Fragment, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Plus, Search, X } from 'lucide-react'
import {
  AppScene,
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
} from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getCurrentLanguage } from '@/locales/i18n'
import { cn } from '@/lib/utils'
import type { QueryObserverResult } from '@tanstack/react-query'
import type { AgentSessionListResponse } from '@/types/agent'
import type { ExploreSession, ExploreSessionListParams } from '../types'
import { getExploreSessionGroup, type ExploreSessionGroup } from '../utils'
import { SessionCard } from './session-card'
import { SessionFilters } from './session-filters'

interface SessionRailProps {
  canvasId: string
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
  canvasId,
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
  const [searchOpen, setSearchOpen] = useState(false)
  const searchInput = useRef<HTMLInputElement>(null)
  const searchButton = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (searchOpen) searchInput.current?.focus()
  }, [searchOpen])
  const hasResultFilters = Boolean(
    params.keywords?.trim() || params.from_date || params.to_date,
  )
  const totalPages = Math.max(1, Math.ceil(total / params.page_size))
  const savedSessions = sessions.filter((session) => !session.isTemporary)
  const clearFilters = () =>
    onChangeParams({
      keywords: '',
      from_date: '',
      to_date: '',
      orderby: 'update_time',
      desc: true,
      page: 1,
    })
  const groupLabel = (group: ExploreSessionGroup) => {
    if (/^\d+-\d+$/.test(group)) {
      const [year, month] = group.split('-').map(Number)
      return new Intl.DateTimeFormat(getCurrentLanguage(), {
        year: 'numeric',
        month: 'long',
      }).format(new Date(year, month - 1, 1))
    }
    return t(`agent.explore.groups.${group}`)
  }
  return (
    <div className="flex h-full min-h-0 flex-col gap-space-sm p-space-sm">
      <Button
        variant="ghost"
        className={cn(
          'w-full justify-start gap-space-sm px-space-sm text-sm',
          isNew &&
            'bg-state-selected-bg text-state-selected-text hover:bg-state-selected-bg hover:text-state-selected-text',
        )}
        onClick={onCreateSession}
      >
        <Plus className="size-icon-sm" />
        {t('agent.explore.newChat')}
      </Button>
      <div className="flex items-center justify-between gap-space-xs px-space-sm pt-space-sm">
        <h2 className="hidden text-xs font-medium text-text-tertiary md:block">
          {t('agent.explore.history')}
        </h2>
        <div className="ml-auto flex items-center gap-space-xs">
          <Button
            variant="ghost"
            size="icon-sm"
            ref={searchButton}
            aria-label={t('agent.explore.searchChats')}
            aria-expanded={searchOpen}
            aria-controls="explore-history-search"
            className={
              params.keywords ? 'text-text-accent' : 'text-text-secondary'
            }
            onClick={() => setSearchOpen((value) => !value)}
          >
            {searchOpen ? (
              <X className="size-icon-sm" />
            ) : (
              <Search className="size-icon-sm" />
            )}
          </Button>
          <SessionFilters
            params={params}
            onChangeParams={onChangeParams}
            onClear={clearFilters}
          />
        </div>
      </div>
      {searchOpen ? (
        <div id="explore-history-search" className="px-space-xs">
          <Input
            inputSize="sm"
            ref={searchInput}
            value={params.keywords || ''}
            leftIcon={<Search className="size-icon-sm" />}
            aria-label={t('agent.explore.searchChats')}
            placeholder={t('agent.explore.searchChats')}
            onChange={(event) =>
              onChangeParams({ keywords: event.target.value })
            }
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setSearchOpen(false)
                searchButton.current?.focus()
              }
            }}
          />
        </div>
      ) : null}
      {hasResultFilters ? (
        <Button
          variant="ghost"
          size="sm"
          className="justify-start px-space-sm text-xs text-text-secondary"
          onClick={clearFilters}
        >
          {t('agent.explore.clearFilters')}
        </Button>
      ) : null}
      <nav
        className="scroll-area min-h-0 flex-1 overflow-y-auto"
        aria-label={t('agent.explore.history')}
        aria-busy={loading}
      >
        {savedSessions.map((session, index) => {
          const group = getExploreSessionGroup(session, params.orderby)
          const previous =
            index > 0
              ? getExploreSessionGroup(savedSessions[index - 1], params.orderby)
              : undefined
          return (
            <Fragment key={session.id}>
              {group && group !== previous ? (
                <h3 className="px-space-sm pt-space-base pb-space-xs text-xs font-medium text-text-tertiary">
                  {groupLabel(group)}
                </h3>
              ) : null}
              <SessionCard
                canvasId={canvasId}
                session={session}
                selected={!isNew && selectedSessionId === session.id}
                disabled={deleting}
                onSelect={() => onSelectSession(session.id, false)}
                onDelete={() => onDeleteSession(session)}
              />
            </Fragment>
          )
        })}
        {loading && savedSessions.length === 0 ? (
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
        ) : savedSessions.length === 0 ? (
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
          />
        ) : null}
      </nav>
      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-space-sm px-space-sm pt-space-xs">
          <p className="text-xs text-text-tertiary">
            {t('agent.explore.paginationLabel', {
              count: total,
              page: params.page,
              pages: totalPages,
            })}
          </p>
          <div className="flex items-center gap-space-xs">
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={params.page <= 1 || loading}
              aria-label={t('agent.explore.previousPage')}
              onClick={() => onChangeParams({ page: params.page - 1 })}
            >
              <ChevronLeft className="size-icon-sm" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={params.page >= totalPages || loading}
              aria-label={t('agent.explore.nextPage')}
              onClick={() => onChangeParams({ page: params.page + 1 })}
            >
              <ChevronRight className="size-icon-sm" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
