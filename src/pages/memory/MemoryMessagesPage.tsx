import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Bot,
  Brain,
  Info,
  MessageSquare,
  Search,
  Settings2,
  SlidersHorizontal,
} from 'lucide-react'
import { DetailTemplate } from '@/components/page-templates/detail-template'
import { EmptyStart } from '@/components/patterns/empty-start'
import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
} from '@/components/patterns/page-states'
import { KindStackIllustration } from '@/components/studio'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SegmentedControl } from '@/components/ui/segmented-control'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useMemoryCapabilities } from '@/hooks/use-memory-revisions'
import { MemoryManagedNotice } from '@/components/memory/memory-managed-notice'
import { MemorySourceEntry } from '@/components/memory/memory-source-entry'
import { MemorySourcePagination } from '@/components/memory/memory-source-pagination'
import { MemoryMessageInspector } from '@/components/memory/memory-message-inspector'
import { MemoryRecallPanel } from '@/components/memory/memory-recall-panel'
import {
  getMemoryEntries,
  getMemoryLifecycle,
} from '@/components/memory/memory-lifecycle'
import {
  useMemoryDetail,
  useMessageList,
  useUpdateMessageState,
  useForgetMessage,
} from '@/hooks/use-memory'
import { ROUTES } from '@/constants'
import type { MemoryMessage } from '@/types/memory'
import {
  MemoryAvatar,
  MemoryIdentityMeta,
  useMemoryCrumbs,
} from './detail/memory-identity'
import {
  MemoryEntryList,
  countMemoryStates,
  type MemoryStateFilter,
  type MemoryView,
} from './detail/memory-entry-list'

const STATES = ['all', 'enabled', 'disabled', 'forgotten'] as const

export function MemoryMessagesPage() {
  const { id } = useParams<{ id: string }>()
  return id ? <MemoryWorkspace key={id} memoryId={id} /> : null
}

function MemoryWorkspace({ memoryId }: { memoryId: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: memory } = useMemoryDetail(memoryId)
  const crumbs = useMemoryCrumbs(memory)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [session, setSession] = useState('')
  const [sessionFilter, setSessionFilter] = useState('')
  const [agent, setAgent] = useState('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const [params] = useSearchParams()
  const [view, setView] = useState<MemoryView>(
    params.has('source_operation') ? 'sources' : 'memories',
  )
  const [state, setState] = useState<MemoryStateFilter>('all')
  const [inspecting, setInspecting] = useState<MemoryMessage | null>(null)
  const [recallOpen, setRecallOpen] = useState(false)
  const inspectTrigger = useRef<HTMLElement | null>(null)
  const recallTrigger = useRef<HTMLButtonElement | null>(null)
  const inspect = (message: MemoryMessage) => {
    inspectTrigger.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    setInspecting(message)
  }
  const query = useMessageList(memoryId, {
    page,
    page_size: pageSize,
    keywords: sessionFilter,
    agent_id: agent === 'all' ? undefined : [agent],
  })
  const sources = useMemo(() => query.data?.message_list ?? [], [query.data])
  const entries = useMemo(() => getMemoryEntries(sources), [sources])
  const stateCounts = useMemo(
    () => countMemoryStates(sources, view),
    [sources, view],
  )
  const enabled = entries.filter(
    ({ message }) => getMemoryLifecycle(message) === 'enabled',
  ).length
  const agents = useMemo(
    () =>
      Array.from(
        new Map(
          sources
            .filter((source) => source.agent_id)
            .map((source) => [
              source.agent_id!,
              source.agent_name || source.agent_id!,
            ]),
        ),
      ),
    [sources],
  )
  const { data: capabilities } = useMemoryCapabilities(memoryId)
  const managed = capabilities?.revisions?.managed === true
  const update = useUpdateMessageState()
  const forget = useForgetMessage()
  const filtered = !!sessionFilter || agent !== 'all'
  const settingsPath = `${ROUTES.MEMORY}/${memoryId}/settings`

  const toolbar = (
    <div className="flex flex-wrap items-center gap-space-sm">
      <SegmentedControl
        aria-label={t('memory.detail.viewLabel')}
        size="sm"
        value={view}
        onValueChange={(value) => {
          setView(value)
          setState('all')
        }}
        options={[
          {
            value: 'memories',
            icon: <Brain />,
            label: (
              <>
                {t('memory.workspace.memories')}{' '}
                <span className="text-xs text-fg-subtle tabular-nums">
                  {entries.length}
                </span>
              </>
            ),
          },
          {
            value: 'sources',
            icon: <MessageSquare />,
            label: (
              <>
                {t('memory.workspace.sources')}{' '}
                <span className="text-xs text-fg-subtle tabular-nums">
                  {sources.length}
                </span>
              </>
            ),
          },
        ]}
      />
      {view === 'sources' && <MemorySourceEntry memoryId={memoryId} />}
      {/* Four states with counts outgrow a phone row; scroll them, not the page. */}
      <div className="max-w-full overflow-x-auto">
        <SegmentedControl
          aria-label={t('memory.workspace.stateFilter')}
          size="sm"
          value={state}
          onValueChange={setState}
          options={STATES.map((value) => ({
            value,
            label: (
              <>
                {t(`memory.workspace.${value}`)}{' '}
                <span className="text-xs text-fg-subtle tabular-nums">
                  {stateCounts[value]}
                </span>
              </>
            ),
          }))}
        />
      </div>
      <span className="flex-1" aria-hidden="true" />
      <Popover open={filterOpen} onOpenChange={setFilterOpen}>
        <PopoverTrigger asChild>
          <Button size="sm" variant={filtered ? 'secondary' : 'outline'}>
            <SlidersHorizontal aria-hidden="true" className="size-icon-sm" />
            {t('common.filter')}
            {filtered && (
              <span className="font-mono text-xs text-fg-muted tabular-nums">
                {Number(!!sessionFilter) + Number(agent !== 'all')}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80">
          <form
            className="space-y-space-base"
            onSubmit={(e) => {
              e.preventDefault()
              setSessionFilter(session.trim())
              setPage(1)
              setFilterOpen(false)
            }}
          >
            <Input
              aria-label={t('memory.messages.sessionId')}
              placeholder={t('memory.workspace.sessionPlaceholder')}
              value={session}
              onChange={(e) => setSession(e.target.value)}
            />
            <Select
              value={agent}
              onValueChange={(value) => {
                setAgent(value)
                setPage(1)
              }}
            >
              <SelectTrigger aria-label={t('memory.workspace.agentFilter')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t('memory.workspace.allAgents')}
                </SelectItem>
                {agents.map(([id, name]) => (
                  <SelectItem key={id} value={id}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-space-sm">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSession('')
                  setSessionFilter('')
                  setAgent('all')
                  setPage(1)
                  setFilterOpen(false)
                }}
              >
                {t('memory.common.clear')}
              </Button>
              <Button type="submit" size="sm">
                {t('common.filter')}
              </Button>
            </div>
          </form>
        </PopoverContent>
      </Popover>
    </div>
  )

  const empty =
    !filtered && page === 1 ? (
      <EmptyStart
        ghost={false}
        illustration={
          <KindStackIllustration kinds={['chat', 'memory', 'agent']} />
        }
        title={t('memory.empty.messagesTitle')}
        description={t('memory.empty.messagesDescription')}
        paths={[
          {
            key: 'agent',
            primary: true,
            icon: <Bot />,
            iconClassName: 'bg-avatar-7-bg text-avatar-7-fg',
            title: t('memory.empty.agentTitle'),
            description: t('memory.empty.agentDescription'),
            cta: t('memory.empty.agentCta'),
            onSelect: () => navigate(ROUTES.AGENTS),
          },
          {
            key: 'settings',
            icon: <Settings2 />,
            iconClassName: 'bg-avatar-8-bg text-avatar-8-fg',
            title: t('memory.detail.settingsPathTitle'),
            description: t('memory.detail.settingsPathDescription'),
            cta: t('memory.detail.settingsPathCta'),
            onSelect: () => navigate(settingsPath),
          },
        ]}
      />
    ) : (
      <PageEmptyState
        title={t(
          filtered
            ? 'memory.workspace.noEntries'
            : 'memory.empty.messagesTitle',
        )}
        description={t(
          filtered
            ? 'memory.workspace.checkSession'
            : 'memory.empty.messagesDescription',
        )}
        icon={<Brain className="size-icon-lg" />}
      />
    )

  return (
    <>
      <DetailTemplate
        title={t('memory.workspace.title')}
        crumbs={crumbs}
        leading={<MemoryAvatar memory={memory} memoryId={memoryId} />}
        subline={<MemoryIdentityMeta memory={memory} />}
        actions={
          <>
            <Button size="sm" variant="outline" asChild>
              <Link to={settingsPath}>
                <Settings2 aria-hidden="true" className="size-icon-sm" />
                {t('memory.workspace.strategy')}
              </Link>
            </Button>
            <Button
              ref={recallTrigger}
              size="sm"
              onClick={() => setRecallOpen(true)}
            >
              <Search aria-hidden="true" className="size-icon-sm" />
              {t('memory.workspace.testRecall')}
            </Button>
          </>
        }
        toolbar={toolbar}
        state={
          query.isPending ? 'loading' : query.isError ? 'error' : 'content'
        }
        loadingState={<PageLoadingState />}
        errorState={<PageErrorState onRetry={() => query.refetch()} />}
        bodyScroll="none"
      >
        <div
          data-scroll-root="memory-entries"
          className="scroll-area min-h-0 flex-1 overflow-y-auto px-space-md py-space-sm sm:px-space-lg"
        >
          {sources.length > 0 && (
            <div className="mb-space-sm flex flex-wrap items-center justify-between gap-space-sm text-xs text-fg-subtle">
              <p className="tabular-nums">
                {t('memory.workspace.pageOverview', {
                  sources: sources.length,
                  memories: entries.length,
                })}{' '}
                · {t('memory.workspace.enabledCount', { count: enabled })}
              </p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t('memory.workspace.stateHelp')}
                  >
                    <Info aria-hidden="true" className="size-icon-sm" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="max-w-sm space-y-space-sm text-xs leading-relaxed"
                >
                  <p>{t('memory.workspace.pageScope', { count: enabled })}</p>
                  <p>{t('memory.workspace.lifecycleHint')}</p>
                </PopoverContent>
              </Popover>
            </div>
          )}
          {managed && <MemoryManagedNotice capabilities={capabilities} />}
          {!sources.length ? (
            empty
          ) : (
            <MemoryEntryList
              sources={sources}
              view={view}
              state={state}
              managed={managed}
              readOnly={
                managed &&
                capabilities.revisions?.coordinated_state_changes !== true
              }
              busy={update.isPending || forget.isPending || query.isFetching}
              onInspect={inspect}
              onStatusChange={(messageId, status) =>
                update.mutate({ memoryId, messageId, status })
              }
              onForget={(messageId) =>
                forget.mutateAsync({ memoryId, messageId })
              }
            />
          )}
        </div>
        {sources.length > 0 || page > 1 ? (
          <MemorySourcePagination
            memoryId={memoryId}
            page={page}
            pageSize={pageSize}
            count={sources.length}
            keywords={sessionFilter}
            agentId={agent === 'all' ? undefined : [agent]}
            loading={query.isFetching}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setPage(1)
            }}
          />
        ) : null}
      </DetailTemplate>
      <MemoryRecallPanel
        memoryId={memoryId}
        open={recallOpen}
        onOpenChange={setRecallOpen}
        onInspect={inspect}
      />
      <MemoryMessageInspector
        memoryId={memoryId}
        message={inspecting}
        onClose={() => setInspecting(null)}
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          const target = inspectTrigger.current?.isConnected
            ? inspectTrigger.current
            : recallTrigger.current
          target?.focus()
        }}
      />
    </>
  )
}
