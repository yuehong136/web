/**
 * Row actions for a document: start/stop parsing, then an overflow menu with
 * the less frequent actions. Everything stays keyboard reachable.
 */

import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Download,
  Edit2,
  ListTree,
  MoreHorizontal,
  PanelRight,
  Play,
  Settings2,
  Square,
  Tags,
  Trash2,
} from 'lucide-react'
import { Button, Tooltip } from '@/components/ui'
import {
  ActionMenu,
  ActionMenuContent,
  ActionMenuItem,
  ActionMenuSeparator,
  ActionMenuTrigger,
} from '@/components/ui/action-menu'
import { toast } from '@/lib/toast'
import type { Document } from '@/types/api'
import { TaskStatus } from './constants'

export interface DocumentRowHandlers {
  onOpenDetails: (doc: Document) => void
  onViewChunks: (doc: Document) => void
  onStartParse: (doc: Document) => void
  onStopParse: (doc: Document) => void
  onRename: (doc: Document) => void
  onDownload: (doc: Document) => void
  onDelete: (doc: Document) => void
  onEditMetadata: (doc: Document) => void
  onChangeChunkMethod: (doc: Document) => void
}

interface DocumentParseButtonProps {
  document: Document
  onStartParse: () => void
  onStopParse: () => void
  /** Shows the label beside the icon (Inspector footer). */
  withLabel?: boolean
}

/** Start a parse, re-parse a parsed document, or stop a running one. */
export const DocumentParseButton: FC<DocumentParseButtonProps> = ({
  document,
  onStartParse,
  onStopParse,
  withLabel = false,
}) => {
  const { t } = useTranslation()
  const isRunning = document.run === TaskStatus.RUNNING
  const label = isRunning
    ? t('knowledge.documents.actions.stopTask')
    : document.run === TaskStatus.UNSTART
      ? t('knowledge.documents.actions.startParse')
      : t('knowledge.documents.actions.reparse')
  const Icon = isRunning ? Square : Play
  const onClick = isRunning ? onStopParse : onStartParse
  if (withLabel)
    return (
      <Button type="button" variant="outline" size="sm" onClick={onClick}>
        <Icon className="size-icon-sm" aria-hidden="true" />
        {label}
      </Button>
    )
  return (
    <Tooltip content={label}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onClick}
        aria-label={t('knowledge.documents.actions.withName', {
          action: label,
          name: document.name,
        })}
      >
        <Icon className="size-icon-sm" aria-hidden="true" />
      </Button>
    </Tooltip>
  )
}

interface DocumentActionCellProps {
  document: Document
  canDownload: boolean
  handlers: DocumentRowHandlers
}

export const DocumentActionCell: FC<DocumentActionCellProps> = ({
  document,
  canDownload,
  handlers,
}) => {
  const { t } = useTranslation()
  const download = () => {
    if (!canDownload) {
      toast.warning(t('knowledge.documents.actions.noDownloadPermission'))
      return
    }
    handlers.onDownload(document)
  }

  return (
    <>
      <DocumentParseButton
        document={document}
        onStartParse={() => handlers.onStartParse(document)}
        onStopParse={() => handlers.onStopParse(document)}
      />
      <ActionMenu>
        <ActionMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t('knowledge.documents.actions.moreFor', {
              name: document.name,
            })}
          >
            <MoreHorizontal className="size-icon-sm" aria-hidden="true" />
          </Button>
        </ActionMenuTrigger>
        <ActionMenuContent align="end">
          <ActionMenuItem onSelect={() => handlers.onOpenDetails(document)}>
            <PanelRight className="size-icon-sm" aria-hidden="true" />
            {t('knowledge.documents.actions.viewDetail')}
          </ActionMenuItem>
          <ActionMenuItem onSelect={() => handlers.onViewChunks(document)}>
            <ListTree className="size-icon-sm" aria-hidden="true" />
            {t('knowledge.documents.actions.viewChunks')}
          </ActionMenuItem>
          <ActionMenuSeparator />
          <ActionMenuItem onSelect={() => handlers.onRename(document)}>
            <Edit2 className="size-icon-sm" aria-hidden="true" />
            {t('knowledge.documents.actions.rename')}
          </ActionMenuItem>
          <ActionMenuItem
            onSelect={() => handlers.onChangeChunkMethod(document)}
          >
            <Settings2 className="size-icon-sm" aria-hidden="true" />
            {t('knowledge.documents.configureParser')}
          </ActionMenuItem>
          <ActionMenuItem onSelect={() => handlers.onEditMetadata(document)}>
            <Tags className="size-icon-sm" aria-hidden="true" />
            {t('knowledge.metadata.editor.editMetadata')}
          </ActionMenuItem>
          <ActionMenuItem disabled={!canDownload} onSelect={download}>
            <Download className="size-icon-sm" aria-hidden="true" />
            {canDownload
              ? t('knowledge.documents.actions.download')
              : t('knowledge.documents.actions.noDownloadPermission')}
          </ActionMenuItem>
          <ActionMenuSeparator />
          <ActionMenuItem danger onSelect={() => handlers.onDelete(document)}>
            <Trash2 className="size-icon-sm" aria-hidden="true" />
            {t('knowledge.documents.actions.delete')}
          </ActionMenuItem>
        </ActionMenuContent>
      </ActionMenu>
    </>
  )
}
