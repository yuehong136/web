import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ExternalLink, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { PageErrorState, PageToolbar } from '@/components/patterns'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { DocumentPreview } from '@/components/knowledge/document-preview'
import { usePreviewResource } from '@/hooks/use-preview-resource'
import type { ChunkData, ChunkListDocument } from '../types'

interface PreviewProps {
  docId?: string
  docInfo: ChunkListDocument | null
  selectedChunk: ChunkData | null
  onClose: () => void
}

const DocumentPreviewPane = (props: PreviewProps) => {
  const [attempt, setAttempt] = useState(0)
  return (
    <PreviewContent
      key={attempt}
      {...props}
      onRetry={() => setAttempt((value) => value + 1)}
    />
  )
}

const PreviewContent = ({
  docId,
  docInfo,
  selectedChunk,
  onClose,
  onRetry,
}: PreviewProps & { onRetry: () => void }) => {
  const { t } = useTranslation()
  const resource = usePreviewResource({
    docId,
    docName: docInfo?.name,
    docType: docInfo?.type,
  })

  const sourceUrl = 'sourceUrl' in resource ? resource.sourceUrl : undefined
  return (
    <div className="flex h-full min-h-0 flex-col bg-background-surface">
      <PageToolbar
        left={
          <span className="truncate text-sm font-medium">
            {t('knowledge.chunks.workspace.source')}
          </span>
        }
        right={
          <>
            {sourceUrl && (
              <Button variant="ghost" size="icon-sm" asChild>
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t('knowledge.preview.openInNewWindow')}
                >
                  <ExternalLink className="size-icon-sm" />
                </a>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              aria-label={t('knowledge.preview.closePreview')}
            >
              <X className="size-icon-sm" />
            </Button>
          </>
        }
      />
      {resource.kind === 'error' ? (
        <div className="min-h-0 flex-1 overflow-auto">
          <PageErrorState
            title={t('knowledge.preview.loadFailed')}
            description={t('knowledge.chunks.workspace.previewUnavailable')}
            retryLabel={t('knowledge.chunks.list.retry')}
            onRetry={onRetry}
            compact
          />
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-hidden">
          <DocumentPreview
            resource={resource}
            docName={docInfo?.name}
            docType={docInfo?.type}
            selectedChunkId={selectedChunk?.chunk_id}
            highlights={selectedChunk?.positions?.map((position) => ({
              page: position[0] || 1,
              x1: position[1] || 0,
              x2: position[2] || 0,
              y1: position[3] || 0,
              y2: position[4] || 0,
            }))}
            onClose={onClose}
            className="h-full min-h-0"
            hideHeader
          />
        </div>
      )}
    </div>
  )
}

export const ChunkSideSheet = ({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) => {
  const returnFocus = useRef<HTMLElement | null>(null)
  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
    >
      <SheetContent
        side="right"
        showCloseButton={false}
        aria-describedby={undefined}
        className="flex h-full w-full max-w-xl flex-col gap-0 border-border-default bg-background-surface p-0 motion-reduce:transition-none sm:w-full sm:max-w-xl"
        onOpenAutoFocus={() => {
          returnFocus.current =
            document.activeElement instanceof HTMLElement
              ? document.activeElement
              : null
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          returnFocus.current?.focus()
        }}
      >
        <SheetTitle className="sr-only">{title}</SheetTitle>
        {children}
      </SheetContent>
    </Sheet>
  )
}

export const DocumentChunksWorkspace = ({
  previewOpen,
  onClosePreview,
  docId,
  docInfo,
  selectedChunk,
  children,
}: Omit<PreviewProps, 'onClose'> & {
  previewOpen: boolean
  onClosePreview: () => void
  children: ReactNode
}) => {
  const { t } = useTranslation()
  const container = useRef<HTMLDivElement>(null)
  const [canSplit, setCanSplit] = useState(false)

  useEffect(() => {
    const element = container.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) =>
      setCanSplit(entry.contentRect.width >= 960),
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const preview = (
    <DocumentPreviewPane
      docId={docId}
      docInfo={docInfo}
      selectedChunk={selectedChunk}
      onClose={onClosePreview}
    />
  )
  return (
    <div ref={container} className="h-full min-h-0 min-w-0 overflow-hidden">
      {previewOpen && canSplit ? (
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel
            id="source"
            defaultSize="42%"
            minSize="30%"
            maxSize="55%"
            className="min-w-0 overflow-hidden"
          >
            {preview}
          </ResizablePanel>
          <ResizableHandle
            aria-label={t('knowledge.chunks.info.resizePreviewPanel')}
            className="bg-border-default focus-visible:ring-state-focus"
          />
          <ResizablePanel
            id="chunks"
            minSize="45%"
            className="flex min-w-0 flex-col overflow-hidden"
          >
            {children}
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <>
          <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
            {children}
          </div>
          <ChunkSideSheet
            open={previewOpen && !canSplit}
            onClose={onClosePreview}
            title={t('knowledge.chunks.workspace.source')}
          >
            {preview}
          </ChunkSideSheet>
        </>
      )}
    </div>
  )
}
