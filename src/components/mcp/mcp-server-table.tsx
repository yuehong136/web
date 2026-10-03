import { useTranslation } from 'react-i18next'
import { Check, Copy, Loader2, TestTube } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  MCPServerActions,
  type MCPServerActionsProps,
} from '@/components/mcp/mcp-server-actions'
import type { MCPServer } from '@/types/mcp'

interface MCPServerTableProps extends Omit<MCPServerActionsProps, 'server'> {
  servers: MCPServer[]
  toolsCount: (server: MCPServer) => number
  onTestConnection: (server: MCPServer) => void
  onViewDetail?: (server: MCPServer) => void
  testingServerId: string | null
  copiedId: string | null
}

const createdDate = (raw?: string) => {
  if (!raw) return '—'
  const timestamp = Number(raw)
  const date = new Date(
    Number.isNaN(timestamp)
      ? raw
      : timestamp < 1e12
        ? timestamp * 1000
        : timestamp,
  )
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString()
}

export const MCPServerTable = ({
  servers,
  toolsCount,
  onEdit,
  onCopy,
  onDelete,
  onViewDetail,
  onTestConnection,
  testingServerId,
  copiedId,
}: MCPServerTableProps) => {
  const { t } = useTranslation()
  const columns = ['name', 'type', 'url', 'tools', 'createdAt', 'actions']
  return (
    <div className="overflow-x-auto rounded-radius-lg border border-border-default bg-background-surface">
      <table className="w-full min-w-[680px] table-fixed text-left text-sm">
        <colgroup>
          <col className="w-1/4" />
          <col className="w-16" />
          <col className="w-1/4" />
          <col className="w-16" />
          <col className="w-24" />
          <col className="w-24" />
        </colgroup>
        <thead className="border-b border-border-subtle bg-background-subtle text-xs text-text-secondary">
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                scope="col"
                className="px-space-base py-space-sm font-medium"
              >
                {t(`mcp.servers.columns.${column}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {servers.map((server) => (
            <tr
              key={server.id}
              className="border-b border-border-subtle last:border-0"
            >
              <th
                scope="row"
                className="px-space-base py-space-base font-medium text-text-primary"
              >
                {onViewDetail ? (
                  <button
                    type="button"
                    className="max-w-full truncate rounded-radius-sm hover:underline focus-visible:ring-2 focus-visible:ring-state-focus focus-visible:outline-hidden"
                    onClick={() => onViewDetail(server)}
                  >
                    {server.name}
                  </button>
                ) : (
                  <span className="block truncate" title={server.name}>
                    {server.name}
                  </span>
                )}
                {server.description && (
                  <p
                    className="mt-space-xs truncate text-xs font-normal text-text-secondary"
                    title={server.description}
                  >
                    {server.description}
                  </p>
                )}
              </th>
              <td className="px-space-base py-space-base text-xs text-text-secondary">
                {server.server_type === 'streamable-http'
                  ? 'HTTP'
                  : server.server_type.toUpperCase()}
              </td>
              <td className="px-space-base py-space-base">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full min-w-0 justify-start px-space-xs text-text-secondary"
                  onClick={() => onCopy(server)}
                  title={server.url}
                  aria-label={t('mcp.servers.actions.copyAddress', {
                    name: server.name,
                  })}
                >
                  <span className="min-w-0 flex-1 truncate font-mono text-xs">
                    {server.url}
                  </span>
                  {copiedId === server.id ? (
                    <Check className="size-icon-sm text-status-success" />
                  ) : (
                    <Copy className="size-icon-sm" />
                  )}
                </Button>
              </td>
              <td className="px-space-base py-space-base text-text-secondary tabular-nums">
                {toolsCount(server)}
              </td>
              <td className="px-space-base py-space-base text-xs text-text-secondary">
                {createdDate(server.create_time)}
              </td>
              <td className="px-space-sm py-space-base">
                <div className="flex items-center justify-end gap-space-xs">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-text-secondary"
                    disabled={testingServerId === server.id}
                    onClick={() => onTestConnection(server)}
                    aria-label={t('mcp.servers.actions.testAddress', {
                      name: server.name,
                    })}
                  >
                    {testingServerId === server.id ? (
                      <Loader2 className="size-icon-sm animate-spin motion-reduce:animate-none" />
                    ) : (
                      <TestTube className="size-icon-sm" />
                    )}
                  </Button>
                  <MCPServerActions
                    server={server}
                    onEdit={onEdit}
                    onCopy={onCopy}
                    onDelete={onDelete}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
