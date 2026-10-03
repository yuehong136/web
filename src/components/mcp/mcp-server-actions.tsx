import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Copy, Edit, MoreHorizontal, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  ActionMenu,
  ActionMenuContent,
  ActionMenuItem,
  ActionMenuSeparator,
  ActionMenuTrigger,
} from '@/components/ui/action-menu'
import type { MCPServer } from '@/types/mcp'

export interface MCPServerActionsProps {
  server: MCPServer
  onEdit: (server: MCPServer, returnFocus?: HTMLButtonElement | null) => void
  onCopy: (server: MCPServer) => void
  onDelete: (server: MCPServer, returnFocus: HTMLButtonElement | null) => void
}

export const MCPServerActions = ({
  server,
  onEdit,
  onCopy,
  onDelete,
}: MCPServerActionsProps) => {
  const { t } = useTranslation()
  const trigger = React.useRef<HTMLButtonElement>(null)
  return (
    <ActionMenu>
      <ActionMenuTrigger asChild>
        <Button
          ref={trigger}
          variant="ghost"
          size="icon-sm"
          className="text-text-secondary"
          aria-label={t('mcp.servers.actions.menu', { name: server.name })}
        >
          <MoreHorizontal className="size-icon-sm" />
        </Button>
      </ActionMenuTrigger>
      <ActionMenuContent align="end">
        <ActionMenuItem onSelect={() => onEdit(server, trigger.current)}>
          <Edit className="size-icon-sm" />
          {t('mcp.servers.actions.edit')}
        </ActionMenuItem>
        <ActionMenuItem onSelect={() => onCopy(server)}>
          <Copy className="size-icon-sm" />
          {t('mcp.servers.actions.copy')}
        </ActionMenuItem>
        <ActionMenuSeparator />
        <ActionMenuItem
          danger
          onSelect={() => onDelete(server, trigger.current)}
        >
          <Trash2 className="size-icon-sm" />
          {t('mcp.servers.actions.delete')}
        </ActionMenuItem>
      </ActionMenuContent>
    </ActionMenu>
  )
}
