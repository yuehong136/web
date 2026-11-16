import { useTranslation } from 'react-i18next'
import {
  Clock,
  FileText,
  FolderOpen,
  Layers,
  MoreHorizontal,
  Pencil,
  Search,
  Settings,
  Trash2,
  Upload,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import {
  ActionMenu,
  ActionMenuContent,
  ActionMenuItem,
  ActionMenuSeparator,
  ActionMenuTrigger,
} from '@/components/ui/action-menu'
import type { KnowledgeBase } from '@/types/api'
import { formatKnowledgeTime, getKnowledgeVisibility } from './utils'
import type { KnowledgeTimeFormat } from './types'

/** Visibility is the per-base state the list API returns (`me` / `team`). */
export function KnowledgeVisibilityBadge({
  knowledgeBase,
}: {
  knowledgeBase: KnowledgeBase
}) {
  const { t } = useTranslation()
  return (
    <Badge variant="secondary">
      {t(`knowledge.list.groups.${getKnowledgeVisibility(knowledgeBase)}`)}
    </Badge>
  )
}

/** Document and chunk counts with the update time; `compact` fits a row. */
export function KnowledgeMeta({
  knowledgeBase,
  timeFormat,
  compact = false,
}: {
  knowledgeBase: KnowledgeBase
  timeFormat: KnowledgeTimeFormat
  compact?: boolean
}) {
  const { t } = useTranslation()
  const counts = [
    {
      key: 'documents',
      icon: FileText,
      value: knowledgeBase.doc_num || 0,
      label: t('knowledge.common.documentsCount', {
        count: knowledgeBase.doc_num || 0,
      }),
    },
    {
      key: 'chunks',
      icon: Layers,
      value: knowledgeBase.chunk_num || 0,
      label: t('knowledge.common.chunksCount', {
        count: knowledgeBase.chunk_num || 0,
      }),
    },
  ]
  const updated = knowledgeBase.update_time
    ? formatKnowledgeTime(knowledgeBase.update_time, timeFormat)
    : null
  return (
    <>
      {counts.map(({ key, icon: Icon, value, label }) => (
        <span
          key={key}
          className="inline-flex items-center gap-space-xs"
          title={compact ? label : undefined}
        >
          <Icon className="size-icon-xs shrink-0" aria-hidden="true" />
          {compact ? (
            <>
              <span className="sr-only">{label}</span>
              <span aria-hidden="true">{value.toLocaleString()}</span>
            </>
          ) : (
            label
          )}
        </span>
      ))}
      {updated ? (
        <span className="inline-flex min-w-0 items-center gap-space-xs">
          <Clock className="size-icon-xs shrink-0" aria-hidden="true" />
          <time
            className="truncate"
            dateTime={new Date(knowledgeBase.update_time).toISOString()}
          >
            {updated}
          </time>
        </span>
      ) : null}
    </>
  )
}

export interface KnowledgeRowActionHandlers {
  onOpen: (knowledgeBase: KnowledgeBase) => void
  onImport: (knowledgeBase: KnowledgeBase) => void
  onSearch: (knowledgeBase: KnowledgeBase) => void
  onEdit: (knowledgeBase: KnowledgeBase) => void
  onSettings: (knowledgeBase: KnowledgeBase) => void
  onDelete: (knowledgeBase: KnowledgeBase) => void
}

/** Quick actions (add documents, retrieval test) and the overflow menu. */
export function KnowledgeRowActions({
  knowledgeBase,
  handlers,
}: {
  knowledgeBase: KnowledgeBase
  handlers: KnowledgeRowActionHandlers
}) {
  const { t } = useTranslation()
  const name = knowledgeBase.name
  return (
    <>
      <Tooltip content={t('knowledge.list.rowActions.addDocuments')}>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t('knowledge.list.rowActions.addDocumentsTo', { name })}
          onClick={() => handlers.onImport(knowledgeBase)}
        >
          <Upload className="size-icon-sm" aria-hidden="true" />
        </Button>
      </Tooltip>
      <Tooltip content={t('knowledge.list.rowActions.searchTest')}>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t('knowledge.list.rowActions.searchTestFor', { name })}
          onClick={() => handlers.onSearch(knowledgeBase)}
        >
          <Search className="size-icon-sm" aria-hidden="true" />
        </Button>
      </Tooltip>
      <ActionMenu>
        <ActionMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t('knowledge.list.rowActions.more', { name })}
          >
            <MoreHorizontal className="size-icon-sm" aria-hidden="true" />
          </Button>
        </ActionMenuTrigger>
        <ActionMenuContent align="end">
          <ActionMenuItem onSelect={() => handlers.onOpen(knowledgeBase)}>
            <FolderOpen className="size-icon-sm" aria-hidden="true" />
            {t('knowledge.list.rowActions.open')}
          </ActionMenuItem>
          <ActionMenuItem onSelect={() => handlers.onEdit(knowledgeBase)}>
            <Pencil className="size-icon-sm" aria-hidden="true" />
            {t('knowledge.list.rowActions.edit')}
          </ActionMenuItem>
          <ActionMenuItem onSelect={() => handlers.onSettings(knowledgeBase)}>
            <Settings className="size-icon-sm" aria-hidden="true" />
            {t('knowledge.list.actions.settings')}
          </ActionMenuItem>
          <ActionMenuSeparator />
          <ActionMenuItem
            danger
            onSelect={() => handlers.onDelete(knowledgeBase)}
          >
            <Trash2 className="size-icon-sm" aria-hidden="true" />
            {t('knowledge.list.actions.delete')}
          </ActionMenuItem>
        </ActionMenuContent>
      </ActionMenu>
    </>
  )
}
