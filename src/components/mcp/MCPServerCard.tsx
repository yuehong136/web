import { useTranslation } from 'react-i18next'
import { Check, Copy, Loader2, Server, TestTube } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  MCPServerActions,
  type MCPServerActionsProps,
} from '@/components/mcp/mcp-server-actions'
import { cn } from '@/lib/utils'
import type { MCPServer, MCPTool } from '@/types/mcp'

interface MCPServerCardProps extends MCPServerActionsProps {
  tools?: MCPTool[]
  isLoadingTools?: boolean
  isOnline?: boolean
  onTestConnection: (server: MCPServer) => void
  onViewDetail?: (server: MCPServer) => void
  isTesting?: boolean
  copied?: boolean
}

export const MCPServerCard = ({
  server,
  tools = [],
  isLoadingTools = false,
  isOnline = false,
  onEdit,
  onDelete,
  onCopy,
  onTestConnection,
  onViewDetail,
  isTesting = false,
  copied = false,
}: MCPServerCardProps) => {
  const { t } = useTranslation()
  const protocol =
    server.server_type === 'streamable-http'
      ? 'HTTP'
      : server.server_type.toUpperCase()
  return (
    <article className="flex h-full min-w-0 flex-col rounded-radius-lg border border-border-default bg-background-surface">
      <div className="flex flex-1 flex-col gap-space-base p-space-base">
        <div className="flex min-w-0 items-start gap-space-sm">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-radius-md bg-background-subtle text-text-secondary">
            <Server className="size-icon-md" />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              className="truncate text-base font-semibold text-text-primary"
              title={server.name}
            >
              {onViewDetail ? (
                <button
                  type="button"
                  onClick={() => onViewDetail(server)}
                  className="max-w-full truncate rounded-radius-sm text-left hover:underline focus-visible:ring-2 focus-visible:ring-state-focus focus-visible:outline-hidden"
                >
                  {server.name}
                </button>
              ) : (
                server.name
              )}
            </h2>
            <span className="text-xs text-text-secondary">{protocol}</span>
          </div>
          <MCPServerActions
            server={server}
            onEdit={onEdit}
            onDelete={onDelete}
            onCopy={onCopy}
          />
        </div>
        {server.description && (
          <p
            className="line-clamp-2 text-sm text-text-secondary"
            title={server.description}
          >
            {server.description}
          </p>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="mt-auto min-w-0 justify-start bg-background-subtle px-space-sm text-text-secondary"
          onClick={() => onCopy(server)}
          aria-label={t('mcp.servers.actions.copyAddress', {
            name: server.name,
          })}
          title={server.url}
        >
          <span className="min-w-0 flex-1 truncate text-left font-mono text-xs">
            {server.url}
          </span>
          {copied ? (
            <Check className="size-icon-sm text-status-success" />
          ) : (
            <Copy className="size-icon-sm" />
          )}
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-space-sm border-t border-border-subtle px-space-base py-space-sm text-sm">
        <span className="flex items-center gap-space-xs text-text-secondary">
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-radius-full',
              isOnline ? 'bg-status-success' : 'bg-text-disabled',
            )}
          />
          {t(
            isOnline
              ? 'mcp.servers.status.ready'
              : 'mcp.servers.status.unverified',
          )}
        </span>
        <span className="text-text-tertiary">·</span>
        <span className="text-text-secondary">
          {isLoadingTools
            ? t('mcp.servers.card.loading')
            : t('mcp.servers.toolsCount', { count: tools.length })}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto h-7 px-space-xs text-xs text-text-secondary"
          disabled={isTesting}
          onClick={() => onTestConnection(server)}
          aria-label={t('mcp.servers.actions.testAddress', {
            name: server.name,
          })}
        >
          {isTesting ? (
            <Loader2 className="size-icon-sm animate-spin motion-reduce:animate-none" />
          ) : (
            <TestTube className="size-icon-sm" />
          )}
          {t(
            isTesting
              ? 'mcp.servers.actions.testing'
              : 'mcp.servers.actions.testShort',
          )}
        </Button>
      </div>
    </article>
  )
}
