import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Check,
  Copy,
  MessagesSquare,
  Plus,
  RefreshCw,
  TestTube,
  Wrench,
} from 'lucide-react'
import { CollectionTemplate } from '@/components/page-templates/collection-template'
import { BulkActionBar } from '@/components/patterns/bulk-action-bar'
import {
  DataTable,
  type DataTableColumn,
} from '@/components/patterns/data-table'
import { FilterBar } from '@/components/patterns/filter-bar'
import { InlineStats } from '@/components/patterns/inline-stats'
import {
  PageEmptyState,
  PageErrorState,
} from '@/components/patterns/page-states'
import { MCPServerActions } from '@/components/mcp/mcp-server-actions'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import {
  getServerTools,
  useFetchMCPServers,
  useMCPStats,
  useTestMCPConnection,
} from '@/hooks/use-mcp-request'
import { toast } from '@/lib/toast'
import { cn, copyToClipboard } from '@/lib/utils'
import { getCurrentLanguage } from '@/locales/i18n'
import type { MCPServer } from '@/types/mcp'
import { MCPBatchPanel } from './mcp-batch-panel'
import { MCPServerDialogs, type ServerDialogState } from './mcp-server-dialogs'
import { MCPTestPanel } from './mcp-test-panel'
import { MCPToolsPanel } from './mcp-tools-panel'
import {
  isMCPTab,
  parseServerTime,
  protocolLabel,
  serverSortTime,
  type MCPTab,
} from './mcp-utils'

/**
 * MCP servers: one list with a side panel whose tabs run tools, batch
 * import/export/delete and connection tests. `?tab=` opens the panel and
 * `?server=` scopes it, so the retired sub-pages redirect here.
 */
export function MCPPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const tab = isMCPTab(params.get('tab')) ? (params.get('tab') as MCPTab) : null
  const serverId = params.get('server')
  const [search, setSearch] = useState('')
  const [protocols, setProtocols] = useState<string[]>([])
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [dialog, setDialog] = useState<ServerDialogState>(null)
  const [returnFocus, setReturnFocus] = useState<HTMLElement | null>(null)
  const openDialog = (next: ServerDialogState, opener: HTMLElement | null) => {
    setReturnFocus(opener)
    setDialog(next)
  }
  const [testingId, setTestingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const keywords = useDebouncedValue(search.trim(), 300)

  const serversQuery = useFetchMCPServers({
    keywords: keywords || undefined,
    page: 1,
    page_size: 100,
  })
  const stats = useMCPStats()
  const testConnection = useTestMCPConnection()
  const servers = useMemo(
    () => serversQuery.data?.mcp_servers ?? [],
    [serversQuery.data],
  )
  const rows = useMemo(
    () =>
      servers
        .filter(
          (server) =>
            !protocols.length || protocols.includes(server.server_type),
        )
        .sort((a, b) =>
          sort === 'newest'
            ? serverSortTime(b) - serverSortTime(a)
            : serverSortTime(a) - serverSortTime(b),
        ),
    [servers, protocols, sort],
  )
  const activeServer = servers.find((server) => server.id === serverId) ?? null

  const openPanel = (next: MCPTab, server?: MCPServer | null) =>
    setParams(
      (previous) => {
        const nextParams = new URLSearchParams(previous)
        nextParams.set('tab', next)
        if (server === null) nextParams.delete('server')
        else if (server) nextParams.set('server', server.id)
        return nextParams
      },
      { replace: true },
    )
  const closePanel = () =>
    setParams(
      (previous) => {
        const nextParams = new URLSearchParams(previous)
        nextParams.delete('tab')
        nextParams.delete('server')
        return nextParams
      },
      { replace: true },
    )

  const quickTest = async (server: MCPServer) => {
    setTestingId(server.id)
    try {
      const tools = await testConnection.mutateAsync({
        url: server.url,
        server_type: server.server_type,
        timeout: 10,
        headers: server.headers,
        variables: server.variables,
      })
      toast.success(t('mcp.servers.testSuccess', { count: tools.length }))
      void serversQuery.refetch()
    } catch {
      // The domain mutation reports the failure.
    } finally {
      setTestingId(null)
    }
  }
  const copyUrl = async (server: MCPServer) => {
    try {
      await copyToClipboard(server.url)
      setCopiedId(server.id)
      toast.success(t('mcp.servers.copySuccess'))
      window.setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error(t('mcp.servers.copyFailed'))
    }
  }

  const dateFormat = new Intl.DateTimeFormat(getCurrentLanguage(), {
    dateStyle: 'medium',
  })
  const columns: DataTableColumn<MCPServer>[] = [
    {
      key: 'name',
      header: t('mcp.servers.columns.name'),
      cell: (server) => (
        <div className="min-w-0">
          <button
            type="button"
            className="max-w-full truncate rounded-radius-sm text-left font-medium text-text-primary outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-state-focus"
            onClick={() => openPanel('tools', server)}
          >
            {server.name}
          </button>
          {server.description ? (
            <p
              className="truncate text-xs text-text-tertiary"
              title={server.description}
            >
              {server.description}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'type',
      header: t('mcp.servers.columns.type'),
      width: '6rem',
      hideBelow: 'sm',
      cell: (server) => protocolLabel(server.server_type),
    },
    {
      key: 'url',
      header: t('mcp.servers.columns.url'),
      hideBelow: 'md',
      cell: (server) => (
        <Button
          variant="ghost"
          size="sm"
          className="max-w-full min-w-0 justify-start px-space-xs font-normal text-text-secondary"
          title={server.url}
          aria-label={t('mcp.servers.actions.copyAddress', {
            name: server.name,
          })}
          onClick={() => void copyUrl(server)}
        >
          <span className="min-w-0 truncate font-mono text-xs">
            {server.url}
          </span>
          {copiedId === server.id ? (
            <Check
              className="size-icon-sm text-status-success"
              aria-hidden="true"
            />
          ) : (
            <Copy className="size-icon-sm" aria-hidden="true" />
          )}
        </Button>
      ),
    },
    {
      key: 'tools',
      header: t('mcp.servers.columns.tools'),
      width: '5rem',
      align: 'end',
      cell: (server) => getServerTools(server).length,
    },
    {
      key: 'created',
      header: t('mcp.servers.columns.createdAt'),
      width: '8rem',
      hideBelow: 'lg',
      cell: (server) => {
        const time = parseServerTime(server.create_time)
        return time ? dateFormat.format(time) : '—'
      },
    },
  ]

  const hasFilters = Boolean(search.trim() || protocols.length)
  const addButton = (
    <Button
      size="sm"
      leftIcon={<Plus className="size-icon-sm" aria-hidden="true" />}
      onClick={(event) => openDialog({ mode: 'create' }, event.currentTarget)}
    >
      {t('mcp.servers.create')}
    </Button>
  )
  const panelOpen = tab !== null
  const panelTitle = activeServer?.name ?? t('mcp.workbench.title')

  return (
    <>
      <CollectionTemplate
        hideHeader
        filterBar={
          <FilterBar
            search={{
              value: search,
              onChange: setSearch,
              placeholder: t('mcp.servers.searchPlaceholder'),
            }}
            filters={[
              {
                key: 'protocol',
                label: t('mcp.servers.columns.type'),
                value: protocols,
                options: [
                  { value: 'streamable-http', label: 'Streamable HTTP' },
                  { value: 'sse', label: 'SSE' },
                ],
              },
            ]}
            onFilterChange={(_, value) => setProtocols(value)}
            onClearFilters={() => setProtocols([])}
            sort={{
              value: sort,
              onChange: (value) => setSort(value as 'newest' | 'oldest'),
              options: [
                { value: 'newest', label: t('mcp.servers.descending') },
                { value: 'oldest', label: t('mcp.servers.ascending') },
              ],
            }}
            actions={
              <>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t('mcp.servers.refresh')}
                  disabled={serversQuery.isFetching}
                  onClick={() => void serversQuery.refetch()}
                >
                  <RefreshCw
                    className={cn(
                      'size-icon-sm',
                      serversQuery.isFetching &&
                        'animate-spin motion-reduce:animate-none',
                    )}
                    aria-hidden="true"
                  />
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/mcp-chat">
                    <MessagesSquare
                      className="size-icon-sm"
                      aria-hidden="true"
                    />
                    {t('mcp.servers.playgroundTitle')}
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  aria-pressed={panelOpen}
                  leftIcon={
                    <Wrench className="size-icon-sm" aria-hidden="true" />
                  }
                  onClick={() => openPanel(tab ?? 'tools', activeServer)}
                >
                  {t('mcp.workbench.open')}
                </Button>
                {addButton}
              </>
            }
          />
        }
        state={
          serversQuery.isPending
            ? 'loading'
            : serversQuery.isError
              ? 'error'
              : rows.length === 0
                ? 'empty'
                : 'content'
        }
        errorState={
          <PageErrorState
            title={t('mcp.servers.loadFailed')}
            description={null}
            retryLabel={t('common.retry')}
            onRetry={() => void serversQuery.refetch()}
          />
        }
        emptyState={
          <PageEmptyState
            title={t(hasFilters ? 'mcp.servers.noMatch' : 'mcp.servers.empty')}
            description={t(
              hasFilters
                ? 'mcp.servers.noMatchDescription'
                : 'mcp.servers.emptyDescription',
            )}
            action={hasFilters ? undefined : addButton}
          />
        }
        footerNote={
          <InlineStats
            aria-busy={stats.isLoading}
            items={[
              {
                key: 'servers',
                label: t('mcp.servers.stats.totalServers'),
                value: stats.totalServers,
              },
              {
                key: 'ready',
                label: t('mcp.servers.stats.readyServers'),
                value: stats.activeServers,
                tone: stats.activeServers ? 'success' : 'default',
              },
              {
                key: 'tools',
                label: t('mcp.servers.stats.availableTools'),
                value: stats.totalTools,
              },
            ]}
          />
        }
        bulkActions={
          <BulkActionBar
            count={selectedIds.length}
            onClear={() => setSelectedIds([])}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openPanel('batch')}
            >
              {t('mcp.workbench.tabs.batch')}
            </Button>
          </BulkActionBar>
        }
        inspector={{
          open: panelOpen,
          onOpenChange: (open) => (open ? undefined : closePanel()),
          title: panelTitle,
          description: activeServer?.url,
          scopeKey: 'mcp-workbench',
          content: (
            <Tabs
              value={tab ?? 'tools'}
              onValueChange={(value) => openPanel(value as MCPTab)}
              className="flex flex-col"
            >
              <TabsList
                aria-label={t('mcp.workbench.tabsLabel')}
                className="w-full"
              >
                <TabsTrigger value="tools">
                  {t('mcp.workbench.tabs.tools')}
                </TabsTrigger>
                <TabsTrigger value="batch">
                  {t('mcp.workbench.tabs.batch')}
                </TabsTrigger>
                <TabsTrigger value="test">
                  {t('mcp.workbench.tabs.test')}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="tools" className="mt-space-base">
                <MCPToolsPanel
                  servers={servers}
                  serverId={activeServer?.id ?? null}
                />
              </TabsContent>
              <TabsContent value="batch" className="mt-space-base">
                <MCPBatchPanel
                  selectedIds={selectedIds}
                  onSelectionCleared={() => setSelectedIds([])}
                />
              </TabsContent>
              <TabsContent value="test" className="mt-space-base">
                <MCPTestPanel
                  key={activeServer?.id ?? 'new'}
                  server={activeServer}
                />
              </TabsContent>
            </Tabs>
          ),
        }}
      >
        <DataTable
          label={t('mcp.servers.title')}
          columns={columns}
          rows={rows}
          getRowId={(server) => server.id}
          activeRowId={panelOpen ? (activeServer?.id ?? undefined) : undefined}
          onRowClick={(server) => openPanel(tab ?? 'tools', server)}
          selection={{
            selectedIds,
            onSelectedIdsChange: setSelectedIds,
            rowLabel: (server) =>
              t('mcp.servers.selectServer', { name: server.name }),
          }}
          rowActions={(server) => (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-text-secondary"
                loading={testingId === server.id}
                aria-label={t('mcp.servers.actions.testAddress', {
                  name: server.name,
                })}
                onClick={() => void quickTest(server)}
              >
                {testingId === server.id ? null : (
                  <TestTube className="size-icon-sm" aria-hidden="true" />
                )}
              </Button>
              <MCPServerActions
                server={server}
                onEdit={(target, opener) =>
                  openDialog({ mode: 'edit', server: target }, opener ?? null)
                }
                onCopy={(target) => void copyUrl(target)}
                onDelete={(target, opener) =>
                  openDialog({ mode: 'delete', server: target }, opener)
                }
              />
            </>
          )}
        />
      </CollectionTemplate>
      <MCPServerDialogs
        state={dialog}
        returnFocus={returnFocus}
        onClose={() => setDialog(null)}
        onSaved={() => void serversQuery.refetch()}
        onDeleted={(id) => {
          setSelectedIds((ids) => ids.filter((item) => item !== id))
          if (id === serverId) closePanel()
        }}
      />
    </>
  )
}
