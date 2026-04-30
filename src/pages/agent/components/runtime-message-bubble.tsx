import { FileIcon } from '@/components/ui/file-icon'
import { cn } from '@/lib/utils'
import { ReferencePanel } from '@/components/chat/ReferencePanel'
import { ReferenceImageList } from '@/components/chat/ReferenceImageList'
import { ReferenceDetailSheet } from '@/components/chat/ReferenceDetailSheet'
import { createReferenceMarkerComponent } from '@/components/chat/ReferenceMarker'
import {
  getMarkdownStreamingOptions,
  mergeMarkdownComponents,
  markdownConfig,
  type MarkdownComponents,
  useMarkdownComponents,
} from '@/components/chat/MarkdownCodeBlock'
import { extractReferencesFromSSEData, type ReferenceChunk } from '@/utils/reference-replacer'
import { convertReferencesToSup } from '@/utils/message-utils'
import { copyToClipboard } from '@/lib/utils'
import { toast } from '@/lib/toast'
import XMarkdown from '@ant-design/x-markdown'
import type { ReactNode } from 'react'
import { useCallback, useState } from 'react'
import { RuntimeTracePanel } from '../features/runtime-workbench/components/runtime-trace-panel'
import type { RuntimeAttachment } from '../features/runtime-workbench/types'
import { hideRawA2UICommandContent } from '../features/runtime-workbench/utils'
import type { INodeEvent } from '../hooks/use-node-loading'
import {
  AgentXCardRenderer,
  type AgentXCardActionPayload,
  type AgentXCardCommand,
  type XCardStatus,
} from '../x-card'

export interface RuntimeMessageBubbleData {
  role?: string
  content?: string
  thinking?: string
  logEvents?: INodeEvent[]
  isStreaming?: boolean
  tips?: string
  files?: RuntimeAttachment[]
  reference?: unknown
  error?: string
  xCardCommands?: AgentXCardCommand[]
  xCardSurfaceIds?: string[]
  xCardStatus?: XCardStatus
}

interface RuntimeMessageBubbleProps {
  message: RuntimeMessageBubbleData
  children?: ReactNode
  onXCardAction?: (payload: AgentXCardActionPayload) => void | Promise<void>
}

interface RuntimeMarkdownProps {
  content: string
  streaming?: boolean
  components?: Partial<MarkdownComponents>
}

function RuntimeMarkdown({
  content,
  streaming = false,
  components,
}: RuntimeMarkdownProps) {
  const markdownComponents = useMarkdownComponents(components)

  if (!content.trim()) {
    return null
  }

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert bubble-copy-text markdown-content">
      <XMarkdown
        paragraphTag="div"
        config={markdownConfig}
        components={markdownComponents}
        streaming={getMarkdownStreamingOptions(streaming)}
      >
        {content}
      </XMarkdown>
    </div>
  )
}

function RuntimeAttachmentList({
  files = [],
}: {
  files?: RuntimeAttachment[]
}) {
  if (!files.length) {
    return null
  }

  return (
    <div className="mt-space-sm flex flex-wrap gap-space-sm">
      {files.map((file, index) => (
        <div
          key={`${file.id || file.name}-${index}`}
          className="flex items-center gap-space-sm rounded-radius-md border border-border-default bg-surface-secondary px-space-sm py-space-xs"
        >
          <FileIcon fileType={file.type} fileName={file.name} size="sm" />
          <span className="max-w-[220px] truncate text-sm text-text-primary">
            {file.name}
          </span>
        </div>
      ))}
    </div>
  )
}

function getReferenceChunks(reference: unknown): ReferenceChunk[] {
  if (Array.isArray(reference)) {
    return reference as ReferenceChunk[]
  }

  return extractReferencesFromSSEData({ reference })
}

export function RuntimeMessageBubble({
  message,
  children,
  onXCardAction,
}: RuntimeMessageBubbleProps) {
  const isUser = message.role === 'user'
  const referenceChunks = getReferenceChunks(message.reference)
  const hasReferences = referenceChunks.length > 0
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedChunk, setSelectedChunk] = useState<ReferenceChunk | null>(null)

  const handleViewDetail = useCallback((chunk: ReferenceChunk) => {
    setSelectedChunk(chunk)
    setDetailOpen(true)
  }, [])

  const handleCopyReference = useCallback(async (content: string) => {
    try {
      await copyToClipboard(content)
      toast.success('已复制到剪贴板')
    } catch {
      toast.error('复制失败')
    }
  }, [])

  const hasXCard = Boolean(
    message.xCardCommands?.length && message.xCardSurfaceIds?.length,
  )
  const visibleContent = hasXCard
    ? hideRawA2UICommandContent(message.content || '')
    : message.content || ''
  const contentWithSup =
    hasReferences && visibleContent
      ? convertReferencesToSup(visibleContent)
      : visibleContent
  const SupComponent = hasReferences
    ? createReferenceMarkerComponent(referenceChunks, {
        onViewDetail: handleViewDetail,
        onCopy: handleCopyReference,
      })
    : undefined
  const markdownComponents = SupComponent
    ? mergeMarkdownComponents({ sup: SupComponent })
    : undefined

  return (
    <>
      <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
        <div
          className={cn(
            'max-w-[88%] rounded-radius-lg px-space-base py-space-sm',
            isUser
              ? 'bg-surface-accent text-text-on-accent'
              : 'bg-surface-secondary text-text-primary',
          )}
        >
          {!isUser && message.logEvents?.length ? (
            <RuntimeTracePanel
              messages={[message]}
              loading={Boolean(message.isStreaming)}
              placement="message"
            />
          ) : null}

          {message.thinking ? (
            <div className="mb-space-sm rounded-radius-md border border-border-primary bg-surface-primary p-space-sm text-xs text-text-secondary">
              <p className="mb-space-xs font-medium text-text-primary">
                Thinking
              </p>
              <p className="whitespace-pre-wrap">{message.thinking}</p>
            </div>
          ) : null}

          {visibleContent ? (
            <RuntimeMarkdown
              content={contentWithSup}
              streaming={Boolean(message.isStreaming)}
              components={markdownComponents}
            />
          ) : !hasXCard ? (
            <p className="whitespace-pre-wrap text-sm">...</p>
          ) : null}

          {!isUser && hasXCard ? (
            <AgentXCardRenderer
              commands={message.xCardCommands}
              surfaceIds={message.xCardSurfaceIds}
              status={message.xCardStatus}
              onAction={onXCardAction}
            />
          ) : null}

          {message.tips ? (
            <div className="mt-space-sm rounded-radius-md border border-border-primary bg-surface-primary p-space-sm text-sm text-text-secondary">
              {message.tips}
            </div>
          ) : null}

          <RuntimeAttachmentList files={message.files} />
          {hasReferences && !message.isStreaming ? (
            <ReferenceImageList
              referenceChunks={referenceChunks}
              messageContent={message.content || ''}
              className="mt-space-base"
              onImageClick={(chunk) => handleViewDetail(chunk)}
            />
          ) : null}
          {hasReferences && !message.isStreaming ? (
            <ReferencePanel
              chunks={referenceChunks}
              onChunkClick={handleViewDetail}
              className="mt-space-sm"
              defaultVisiblePerDoc={2}
            />
          ) : null}
          {children}

          {message.error ? (
            <p className="mt-space-sm text-xs text-status-error">
              {message.error}
            </p>
          ) : null}
        </div>
      </div>
      <ReferenceDetailSheet
        open={detailOpen}
        onOpenChange={setDetailOpen}
        chunk={selectedChunk}
        allChunks={referenceChunks}
      />
    </>
  )
}
