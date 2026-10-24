import { useTranslation } from 'react-i18next'
import {
  ArrowUpRight,
  Download,
  FilePenLine,
  History,
  MoreHorizontal,
  Tag,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  ActionMenu,
  ActionMenuContent,
  ActionMenuItem,
  ActionMenuSeparator,
  ActionMenuTrigger,
} from '@/components/ui/action-menu'
import type { AgentFlow } from '@/types/agent'

export interface AgentActionProps {
  flow: AgentFlow
  onOpen: (flow: AgentFlow) => void
  onDelete: (flow: AgentFlow) => void
  onRename?: (flow: AgentFlow) => void
  onViewLogs?: (flow: AgentFlow) => void
  onEditTags?: (flow: AgentFlow) => void
  onExport?: (flow: AgentFlow) => void
}
export function AgentActions({
  flow,
  title,
  onOpen,
  onDelete,
  onRename,
  onViewLogs,
  onEditTags,
  onExport,
}: AgentActionProps & { title: string }) {
  const { t } = useTranslation()
  return (
    <ActionMenu>
      <ActionMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t('agents.actionsFor', { name: title })}
        >
          <MoreHorizontal className="size-icon-sm" aria-hidden="true" />
        </Button>
      </ActionMenuTrigger>
      <ActionMenuContent align="end">
        <ActionMenuItem onSelect={() => onOpen(flow)}>
          <ArrowUpRight className="size-icon-sm" aria-hidden="true" />
          {t('agents.openEditor')}
        </ActionMenuItem>
        {onRename && (
          <ActionMenuItem onSelect={() => onRename(flow)}>
            <FilePenLine className="size-icon-sm" aria-hidden="true" />
            {t('agents.rename')}
          </ActionMenuItem>
        )}
        {onEditTags && (
          <ActionMenuItem onSelect={() => onEditTags(flow)}>
            <Tag className="size-icon-sm" aria-hidden="true" />
            {t('agents.editTags')}
          </ActionMenuItem>
        )}
        {onExport && (
          <ActionMenuItem onSelect={() => onExport(flow)}>
            <Download className="size-icon-sm" aria-hidden="true" />
            {t('agents.exportJson')}
          </ActionMenuItem>
        )}
        {onViewLogs && (
          <ActionMenuItem onSelect={() => onViewLogs(flow)}>
            <History className="size-icon-sm" aria-hidden="true" />
            {t('agents.viewLogs')}
          </ActionMenuItem>
        )}
        <ActionMenuSeparator />
        <ActionMenuItem danger onSelect={() => onDelete(flow)}>
          <Trash2 className="size-icon-sm" aria-hidden="true" />
          {t('common.delete')}
        </ActionMenuItem>
      </ActionMenuContent>
    </ActionMenu>
  )
}
