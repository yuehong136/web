import { useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Brain,
  MessageSquare,
  Search,
  Settings2,
  SlidersHorizontal,
  Info,
} from 'lucide-react'
import { ConsolePageTemplate } from '@/components/page-templates/console-page-template'
import { PageHeader } from '@/components/patterns/page-header'
import { PageToolbar } from '@/components/patterns/page-toolbar'
import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
} from '@/components/patterns/page-states'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { MemorySourcePagination } from '@/components/memory/memory-source-pagination'
import { MemoryMessageFeed } from '@/components/memory/memory-message-feed'
import { MemoryMessageInspector } from '@/components/memory/memory-message-inspector'
import { MemoryRecallPanel } from '@/components/memory/memory-recall-panel'
import {
  getMemoryEntries,
  getMemoryLifecycle,
  type MemoryLifecycle,
} from '@/components/memory/memory-lifecycle'
import {
  useMessageList,
  useUpdateMessageState,
  useForgetMessage,
} from '@/hooks/use-memory'
import type { MemoryMessage } from '@/types/memory'

export function MemoryMessagesPage() {
  const { id } = useParams<{ id: string }>()
  return id ? <MemoryWorkspace key={id} memoryId={id} /> : null
}

function MemoryWorkspace({ memoryId }: { memoryId: string }) {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [session, setSession] = useState('')
  const [sessionFilter, setSessionFilter] = useState('')
  const [agent, setAgent] = useState('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const [view, setView] = useState<'memories' | 'sources'>('memories')
  const [state, setState] = useState<'all' | MemoryLifecycle>('all')
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
  const enabled = entries.filter(
    ({ message }) => getMemoryLifecycle(message) === 'enabled',
  ).length
  const update = useUpdateMessageState()
  const forget = useForgetMessage()
  const filtered = !!sessionFilter || agent !== 'all'
  return (
    <ConsolePageTemplate
      header={
        <PageHeader
          compact
          title={t('memory.workspace.title')}
          description={t('memory.workspace.description')}
          titleSize="md"
          wrapActions
          actions={
            <>
              <Button size="sm" variant="outline" asChild>
                <Link to={`/memory/${memoryId}/settings`}>
                  <Settings2 className="size-icon-sm" />
                  {t('memory.workspace.strategy')}
                </Link>
              </Button>
              <Button
                ref={recallTrigger}
                size="sm"
                onClick={() => setRecallOpen(true)}
              >
                <Search className="size-icon-sm" />
                {t('memory.workspace.testRecall')}
              </Button>
            </>
          }
        />
      }
      toolbar={
        <PageToolbar
          wrap
          left={
            <Tabs
              value={view}
              onValueChange={(value) => {
                setView(value as typeof view)
                setState('all')
              }}
            >
              <TabsList className="h-9">
                <TabsTrigger value="memories" className="gap-space-xs text-sm">
                  <Brain className="size-icon-sm" />
                  {t('memory.workspace.memories')}
                  <span className="text-xs tabular-nums">{entries.length}</span>
                </TabsTrigger>
                <TabsTrigger value="sources" className="gap-space-xs text-sm">
                  <MessageSquare className="size-icon-sm" />
                  {t('memory.workspace.sources')}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          }
          right={
            <>
              <Select
                value={state}
                onValueChange={(value) => setState(value as typeof state)}
              >
                <SelectTrigger
                  aria-label={t('memory.workspace.stateFilter')}
                  className="h-9 w-32"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['all', 'enabled', 'disabled', 'forgotten'] as const).map(
                    (value) => (
                      <SelectItem key={value} value={value}>
                        {t(`memory.workspace.${value}`)}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
              <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    variant={filtered ? 'secondary' : 'outline'}
                  >
                    <SlidersHorizontal className="size-icon-sm" />
                    {t('common.filter')}
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
                      <SelectTrigger
                        aria-label={t('memory.workspace.agentFilter')}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          {t('memory.workspace.allAgents')}
                        </SelectItem>
                        {Array.from(
                          new Map(
                            sources
                              .filter((source) => source.agent_id)
                              .map((source) => [
                                source.agent_id!,
                                source.agent_name || source.agent_id!,
                              ]),
                          ),
                        ).map(([id, name]) => (
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
            </>
          }
        />
      }
      footer={
        !query.isPending &&
        !query.isError &&
        (sources.length > 0 || page > 1) ? (
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
        ) : null
      }
    >
      <div className="px-space-lg py-space-sm">
        <div className="mb-space-sm flex flex-wrap items-center justify-between gap-space-sm text-xs text-text-tertiary">
          <p>
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
                <Info className="size-icon-sm" />
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
        {query.isPending ? (
          <PageLoadingState />
        ) : query.isError ? (
          <PageErrorState onRetry={() => query.refetch()} />
        ) : !sources.length ? (
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
        ) : (
          <MemoryMessageFeed
            sources={sources}
            view={view}
            state={state}
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
    </ConsolePageTemplate>
  )
}
