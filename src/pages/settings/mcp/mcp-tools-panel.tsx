import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Play, RefreshCw, Save, Search } from 'lucide-react'
import { mcpAPI } from '@/api/mcp'
import { ToolItem } from '@/components/mcp/tool-item'
import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
} from '@/components/patterns/page-states'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { mcpQueryKeys, useFetchMCPTools } from '@/hooks/use-mcp-request'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import type { MCPServer } from '@/types/mcp'
import { MCPToolRunDialog, type ToolRunTarget } from './mcp-tool-run-dialog'
import { EntityAvatar } from '@/components/patterns/entity-avatar'

/** Live tool lists of one server (or all of them), with a runner per tool. */
export function MCPToolsPanel({
  servers,
  serverId,
}: {
  servers: MCPServer[]
  serverId: string | null
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [running, setRunning] = useState<ToolRunTarget | null>(null)
  const [caching, setCaching] = useState<string | null>(null)
  const serverIds = useMemo(
    () => (serverId ? [serverId] : servers.map((server) => server.id)),
    [serverId, servers],
  )
  const toolsQuery = useFetchMCPTools(serverIds, serverIds.length > 0, 30)
  const needle = search.trim().toLowerCase()
  const groups = serverIds
    .map((id) => ({
      server: servers.find((server) => server.id === id),
      tools: (toolsQuery.data?.[id] ?? []).filter(
        (tool) =>
          !needle ||
          tool.name.toLowerCase().includes(needle) ||
          tool.description?.toLowerCase().includes(needle),
      ),
    }))
    .filter(
      (group): group is { server: MCPServer; tools: typeof group.tools } =>
        Boolean(group.server) && group.tools.length > 0,
    )

  const cacheTools = async (server: MCPServer) => {
    const tools = toolsQuery.data?.[server.id]
    if (!tools) return
    setCaching(server.id)
    try {
      await mcpAPI.cacheTools({ mcp_id: server.id, tools })
      await queryClient.invalidateQueries({ queryKey: mcpQueryKeys.servers() })
      toast.success(t('mcp.tools.cached', { name: server.name }))
    } catch {
      toast.error(t('mcp.tools.cacheFailed'))
    } finally {
      setCaching(null)
    }
  }

  let body
  if (serverIds.length === 0)
    body = (
      <PageEmptyState
        compact
        title={t('mcp.servers.empty')}
        description={null}
      />
    )
  else if (toolsQuery.isPending)
    body = (
      <PageLoadingState
        compact
        title={t('mcp.tools.loading')}
        description={null}
      />
    )
  else if (toolsQuery.isError)
    body = (
      <PageErrorState
        compact
        titleAs="h3"
        title={t('mcp.tools.loadFailed')}
        description={null}
        retryLabel={t('common.retry')}
        onRetry={() => void toolsQuery.refetch()}
      />
    )
  else if (groups.length === 0)
    body = (
      <PageEmptyState
        compact
        title={t(needle ? 'mcp.tools.noMatch' : 'mcp.tools.empty')}
        description={null}
      />
    )
  else
    body = groups.map(({ server, tools }) => (
      <section
        key={server.id}
        aria-label={server.name}
        className="flex flex-col"
      >
        <div className="flex items-center gap-space-sm py-space-xs">
          <EntityAvatar
            name={server.name}
            seed={server.id}
            kind="mcp"
            tone="kind"
            size="sm"
          />
          <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-fg">
            {server.name}
            <span className="ml-space-sm text-xs font-normal text-fg-subtle tabular-nums">
              {t('mcp.servers.toolsCount', { count: tools.length })}
            </span>
          </h3>
          <Button
            variant="ghost"
            size="sm"
            loading={caching === server.id}
            leftIcon={<Save className="size-icon-sm" aria-hidden="true" />}
            onClick={() => void cacheTools(server)}
          >
            {t('mcp.tools.cache')}
          </Button>
        </div>
        {tools.map((tool) => (
          <ToolItem
            key={tool.name}
            tool={tool}
            actions={
              <Button
                variant="outline"
                size="sm"
                aria-label={t('mcp.tools.runTool', { name: tool.name })}
                leftIcon={<Play className="size-icon-sm" aria-hidden="true" />}
                onClick={() =>
                  setRunning({
                    tool,
                    serverId: server.id,
                    serverName: server.name,
                  })
                }
              >
                {t('mcp.tools.run')}
              </Button>
            }
          />
        ))}
      </section>
    ))

  return (
    <div className="flex flex-col gap-space-sm">
      <div className="flex items-center gap-space-sm">
        <Input
          type="search"
          inputSize="sm"
          className="min-w-0 flex-1"
          leftIcon={<Search className="size-icon-sm" aria-hidden="true" />}
          aria-label={t('mcp.tools.search')}
          placeholder={t('mcp.tools.search')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t('mcp.tools.refresh')}
          disabled={toolsQuery.isFetching}
          onClick={() => void toolsQuery.refetch()}
        >
          <RefreshCw
            className={cn(
              'size-icon-sm',
              toolsQuery.isFetching &&
                'animate-spin motion-reduce:animate-none',
            )}
            aria-hidden="true"
          />
        </Button>
      </div>
      {body}
      <MCPToolRunDialog target={running} onClose={() => setRunning(null)} />
    </div>
  )
}
