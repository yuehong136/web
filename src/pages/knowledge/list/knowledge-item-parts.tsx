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
import { ResourceChip } from '@/components/patterns/resource-card'
import { EmbeddingModelChip } from '@/components/knowledge/knowledge-identity'
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
    <Badge>
      {t(`knowledge.list.groups.${getKnowledgeVisibility(knowledgeBase)}`)}
    </Badge>
  )
}

function KnowledgeUpdated({
  knowledgeBase,
  timeFormat,
}: {
  knowledgeBase: KnowledgeBase
  timeFormat: KnowledgeTimeFormat
}) {
  if (!knowledgeBase.update_time) return null
  return (
    <span className="inline-flex min-w-0 items-center gap-space-xs">
      <Clock className="size-icon-xs shrink-0" aria-hidden="true" />
      <time
        className="truncate"
        dateTime={new Date(knowledgeBase.update_time).toISOString()}
      >
        {formatKnowledgeTime(knowledgeBase.update_time, timeFormat)}
      </time>
    </span>
  )
}

/** Row meta: document and chunk counts with the update time. */
export function KnowledgeMeta({
  knowledgeBase,
  timeFormat,
}: {
  knowledgeBase: KnowledgeBase
  timeFormat: KnowledgeTimeFormat
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
  return (
    <>
      {counts.map(({ key, icon: Icon, value, label }) => (
        <span
          key={key}
          className="inline-flex items-center gap-space-xs"
          title={label}
        >
          <Icon className="size-icon-xs shrink-0" aria-hidden="true" />
          <span className="sr-only">{label}</span>
          <span aria-hidden="true">{value.toLocaleString()}</span>
        </span>
      ))}
      <KnowledgeUpdated knowledgeBase={knowledgeBase} timeFormat={timeFormat} />
    </>
  )
}

/** Card footer: the update time (counts sit in the chips above it). */
export function KnowledgeCardMeta({
  knowledgeBase,
  timeFormat,
}: {
  knowledgeBase: KnowledgeBase
  timeFormat: KnowledgeTimeFormat
}) {
  return (
    <KnowledgeUpdated knowledgeBase={knowledgeBase} timeFormat={timeFormat} />
  )
}

/** Card chips: embedding model with its provider logo, documents, chunks. */
export function KnowledgeCardChips({
  knowledgeBase,
}: {
  knowledgeBase: KnowledgeBase
}) {
  const { t } = useTranslation()
  return (
    <>
      <EmbeddingModelChip modelId={knowledgeBase.embd_id} />
      <ResourceChip icon={<FileText aria-hidden="true" />}>
        {t('knowledge.common.documentsCount', {
          count: knowledgeBase.doc_num || 0,
        })}
      </ResourceChip>
      <ResourceChip icon={<Layers aria-hidden="true" />}>
        {t('knowledge.common.chunksCount', {
          count: knowledgeBase.chunk_num || 0,
        })}
      </ResourceChip>
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

/**
 * Quick actions (add documents, retrieval test) and the overflow menu. Cards
 * have room for one button, so `compact` folds the quick actions into it.
 */
export function KnowledgeRowActions({
  knowledgeBase,
  handlers,
  compact = false,
}: {
  knowledgeBase: KnowledgeBase
  handlers: KnowledgeRowActionHandlers
  compact?: boolean
}) {
  const { t } = useTranslation()
  const name = knowledgeBase.name
  return (
    <>
      {compact ? null : (
        <>
          <Tooltip content={t('knowledge.list.rowActions.addDocuments')}>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t('knowledge.list.rowActions.addDocumentsTo', {
                name,
              })}
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
              aria-label={t('knowledge.list.rowActions.searchTestFor', {
                name,
              })}
              onClick={() => handlers.onSearch(knowledgeBase)}
            >
              <Search className="size-icon-sm" aria-hidden="true" />
            </Button>
          </Tooltip>
        </>
      )}
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
          {compact ? (
            <>
              <ActionMenuItem onSelect={() => handlers.onImport(knowledgeBase)}>
                <Upload className="size-icon-sm" aria-hidden="true" />
                {t('knowledge.list.rowActions.addDocuments')}
              </ActionMenuItem>
              <ActionMenuItem onSelect={() => handlers.onSearch(knowledgeBase)}>
                <Search className="size-icon-sm" aria-hidden="true" />
                {t('knowledge.list.rowActions.searchTest')}
              </ActionMenuItem>
            </>
          ) : null}
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
