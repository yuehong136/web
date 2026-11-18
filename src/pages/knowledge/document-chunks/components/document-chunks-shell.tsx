import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ExternalLink, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { PageErrorState } from '@/components/patterns'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DocumentPreview } from '@/components/knowledge/document-preview'
import { usePreviewResource } from '@/hooks/use-preview-resource'
import { previewErrorMessageKey } from '@/lib/knowledge/preview-error'
import type { ChunkData, ChunkListDocument, ChunkPanelTab } from '../types'

/** The workspace splits once it is this wide; narrower, the panel is a sheet. */
const SPLIT_MIN_WIDTH = 960

interface PreviewProps {
  docId?: string
  docInfo: ChunkListDocument | null
  selectedChunk: ChunkData | null
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
    <div className="flex h-full min-h-0 flex-col">
      {resource.kind === 'error' ? (
        <div className="min-h-0 flex-1 overflow-auto">
          <PageErrorState
            title={t('knowledge.preview.loadFailed')}
            description={
              resource.category === 'unavailable'
                ? t('knowledge.chunks.workspace.previewUnavailable')
                : t(previewErrorMessageKey(resource.category))
            }
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
            className="h-full min-h-0"
            hideHeader
          />
        </div>
      )}
      {sourceUrl ? (
        <div className="flex shrink-0 justify-end border-t border-line-subtle px-space-md py-space-xs">
          <Button variant="link" size="sm" className="h-auto p-0" asChild>
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-icon-sm" aria-hidden="true" />
              {t('knowledge.preview.openInNewWindow')}
            </a>
          </Button>
        </div>
      ) : null}
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
        className="flex h-full w-full max-w-xl flex-col gap-0 border-line bg-surface p-0 motion-reduce:transition-none sm:w-full sm:max-w-xl"
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

interface ChunkSidePanelProps extends PreviewProps {
  tab: ChunkPanelTab
  onTabChange: (tab: ChunkPanelTab) => void
  onClose: () => void
  infoPanel?: ReactNode
  configPanel?: ReactNode
}

/**
 * Source with the selected chunk highlighted, document information and the
 * parser configuration, as tabs. The source stays mounted so switching tabs
 * keeps its scroll position.
 */
const ChunkSidePanel = ({
  tab,
  onTabChange,
  onClose,
  infoPanel,
  configPanel,
  ...preview
}: ChunkSidePanelProps) => {
  const { t } = useTranslation()
  const tabs: { value: ChunkPanelTab; label: string; content: ReactNode }[] = [
    {
      value: 'source',
      label: t('knowledge.chunks.workspace.sourceTab'),
      content: <DocumentPreviewPane {...preview} />,
    },
    ...(infoPanel
      ? [
          {
            value: 'info' as const,
            label: t('knowledge.chunks.info.title'),
            content: infoPanel,
          },
        ]
      : []),
    ...(configPanel
      ? [
          {
            value: 'config' as const,
            label: t('knowledge.chunks.workspace.configTab'),
            content: configPanel,
          },
        ]
      : []),
  ]
  const active = tabs.some((item) => item.value === tab) ? tab : 'source'
  return (
    <Tabs
      value={active}
      onValueChange={(value) => onTabChange(value as ChunkPanelTab)}
      className="flex h-full min-h-0 flex-col bg-sunken"
    >
      <div className="flex shrink-0 items-end gap-space-sm border-b border-line-subtle pr-space-sm pl-space-md">
        <TabsList
          aria-label={t('knowledge.chunks.workspace.panelLabel')}
          className="min-w-0 flex-1 overflow-x-auto border-b-0"
        >
          {tabs.map((item) => (
            <TabsTrigger key={item.value} value={item.value}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <Button
          variant="ghost"
          size="icon-sm"
          className="mb-space-xs"
          onClick={onClose}
          aria-label={t('knowledge.chunks.workspace.closePanel')}
        >
          <X className="size-icon-sm" aria-hidden="true" />
        </Button>
      </div>
      {tabs.map((item) => (
        <TabsContent
          key={item.value}
          value={item.value}
          forceMount={item.value === 'source' ? true : undefined}
          className="mt-0 min-h-0 flex-1 overflow-hidden data-[state=inactive]:hidden"
        >
          {item.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}

export const DocumentChunksWorkspace = ({
  previewOpen,
  onClosePreview,
  docId,
  docInfo,
  selectedChunk,
  panelTab = 'source',
  onPanelTabChange,
  infoPanel,
  configPanel,
  onSplitChange,
  children,
}: PreviewProps & {
  /** Whether the side panel is open. */
  previewOpen: boolean
  onClosePreview: () => void
  panelTab?: ChunkPanelTab
  onPanelTabChange?: (tab: ChunkPanelTab) => void
  infoPanel?: ReactNode
  configPanel?: ReactNode
  /** Reports whether the panel docks beside the chunks or opens as a sheet. */
  onSplitChange?: (canSplit: boolean) => void
  children: ReactNode
}) => {
  const { t } = useTranslation()
  const container = useRef<HTMLDivElement>(null)
  const [canSplit, setCanSplit] = useState(false)
  const [localTab, setLocalTab] = useState<ChunkPanelTab>(panelTab)
  const tab = onPanelTabChange ? panelTab : localTab
  const changeTab = onPanelTabChange ?? setLocalTab
  const reportSplit = useRef(onSplitChange)
  useEffect(() => {
    reportSplit.current = onSplitChange
  }, [onSplitChange])

  useEffect(() => {
    const element = container.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      const next = entry.contentRect.width >= SPLIT_MIN_WIDTH
      setCanSplit(next)
      reportSplit.current?.(next)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const panel = (
    <ChunkSidePanel
      docId={docId}
      docInfo={docInfo}
      selectedChunk={selectedChunk}
      tab={tab}
      onTabChange={changeTab}
      onClose={onClosePreview}
      infoPanel={infoPanel}
      configPanel={configPanel}
    />
  )
  return (
    <div ref={container} className="h-full min-h-0 min-w-0 overflow-hidden">
      {previewOpen && canSplit ? (
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel
            id="chunks"
            minSize="45%"
            className="relative flex min-w-0 flex-col overflow-hidden"
          >
            {children}
          </ResizablePanel>
          <ResizableHandle
            aria-label={t('knowledge.chunks.info.resizePreviewPanel')}
            className="bg-line-subtle focus-visible:ring-line-focus"
          />
          <ResizablePanel
            id="source"
            defaultSize="40%"
            minSize="28%"
            maxSize="55%"
            className="min-w-0 overflow-hidden"
          >
            {panel}
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <>
          <div className="relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
            {children}
          </div>
          <ChunkSideSheet
            open={previewOpen && !canSplit}
            onClose={onClosePreview}
            title={t('knowledge.chunks.workspace.source')}
          >
            {panel}
          </ChunkSideSheet>
        </>
      )}
    </div>
  )
}
