import type { MouseEvent, ReactNode } from 'react'
import { PanelRightOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Tooltip } from '@/components/ui'
import { DocumentPreview } from '@/components/knowledge/document-preview'
import { cn } from '@/lib/utils'
import type { ChunkData, ChunkListDocument, CSSVarStyle } from '../types'

type ResizeTarget = 'preview' | 'info'

interface DocumentPreviewPaneProps {
  open: boolean
  docId?: string
  docInfo: ChunkListDocument | null
  selectedChunk: ChunkData | null
  style: CSSVarStyle
  width: number
  onClose: () => void
  onResizeStart: (
    target: ResizeTarget,
    startX: number,
    startWidth: number,
  ) => void
}

export const DocumentPreviewPane = ({
  open,
  docId,
  docInfo,
  selectedChunk,
  style,
  width,
  onClose,
  onResizeStart,
}: DocumentPreviewPaneProps) => {
  const { t } = useTranslation()

  if (!open) return null

  return (
    <>
      {docInfo && docId && (
        <div
          className="hidden flex-col border-r border-border-default bg-background-default lg:flex lg:w-[var(--preview-panel-width)]"
          style={style}
        >
          <div className="flex-1 overflow-hidden">
            <DocumentPreview
              docId={docId}
              docName={docInfo.name}
              docType={docInfo.type}
              selectedChunkId={selectedChunk?.chunk_id}
              highlights={selectedChunk?.positions?.map((position) => ({
                page: position[0] || 1,
                x1: position[1] || 0,
                x2: position[2] || 0,
                y1: position[3] || 0,
                y2: position[4] || 0,
              }))}
              onClose={onClose}
              className="h-full"
            />
          </div>
        </div>
      )}
      <ResizeHandle
        ariaLabel={t('knowledge.chunks.info.resizePreviewPanel')}
        onMouseDown={(event) => onResizeStart('preview', event.clientX, width)}
      />
    </>
  )
}

interface DocumentInfoShellProps {
  open: boolean
  style: CSSVarStyle
  width: number
  onOpen: () => void
  onResizeStart: (
    target: ResizeTarget,
    startX: number,
    startWidth: number,
  ) => void
  children: ReactNode
}

export const DocumentInfoShell = ({
  open,
  style,
  width,
  onOpen,
  onResizeStart,
  children,
}: DocumentInfoShellProps) => {
  const { t } = useTranslation()

  return (
    <>
      {open && (
        <ResizeHandle
          ariaLabel={t('knowledge.chunks.info.resizeInfoPanel')}
          onMouseDown={(event) => onResizeStart('info', event.clientX, width)}
        />
      )}
      <div
        className={cn(
          'relative flex flex-col border-l border-border-default bg-background-subtle transition-all duration-200',
          open
            ? 'w-full lg:w-[var(--info-panel-width)]'
            : 'w-10 lg:w-10 lg:min-w-10',
        )}
        style={open ? style : undefined}
      >
        {!open ? (
          <div className="flex flex-col items-center pt-2">
            <Tooltip content={t('knowledge.chunks.info.expandPanel')}>
              <Button variant="ghost" size="sm" onClick={onOpen}>
                <PanelRightOpen className="h-4 w-4" />
              </Button>
            </Tooltip>
          </div>
        ) : (
          children
        )}
      </div>
    </>
  )
}

const ResizeHandle = ({
  ariaLabel,
  onMouseDown,
}: {
  ariaLabel: string
  onMouseDown: (event: MouseEvent<HTMLButtonElement>) => void
}) => (
  <button
    type="button"
    aria-label={ariaLabel}
    className="hidden w-1 cursor-col-resize appearance-none border-0 bg-transparent p-0 hover:bg-border-subtle lg:block"
    onMouseDown={(event) => {
      event.preventDefault()
      onMouseDown(event)
    }}
  />
)
