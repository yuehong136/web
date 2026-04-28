import { Fragment, useCallback, useMemo, useState } from 'react'
import { Bubble } from '@ant-design/x'
import BubbleLoading from '@ant-design/x/es/bubble/loading'
import { ThinkWrapper } from '@/components/chat/ThinkWrapper'
import { MessageActionsFooter } from '@/components/chat/MessageActionsFooter'
import { ReferencePanel } from '@/components/chat/ReferencePanel'
import { ReferenceImageList } from '@/components/chat/ReferenceImageList'
import { ReferenceDetailSheet } from '@/components/chat/ReferenceDetailSheet'
import { createReferenceMarkerComponent } from '@/components/chat/ReferenceMarker'
import { CarouselWrapper } from '@/components/chat/CarouselWrapper'
import { copyToClipboard } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { convertReferencesToSup, processContentForCarousel } from '@/utils/message-utils'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import { extractThinkContent, type ThinkingStatus } from '@/utils/think-utils'
import DebugContent from '../../debug-content'
import { AgentRuntimeStatus, type RuntimeMessage } from '../../features/runtime-workbench/types'
import type { BeginQuery } from '../../types'
import {
  AssistantAvatar,
  getReferenceChunks,
  RuntimeAttachmentList,
  SessionMarkdown,
  UserAvatar,
} from './session-message-renderers'

interface SessionMessageListProps {
  canvasId: string
  messages: RuntimeMessage[]
  status: AgentRuntimeStatus
  onSubmitAwaitingInputs: (
    messageId: string,
    values: BeginQuery[],
  ) => void | Promise<void>
}

export function SessionMessageList({
  canvasId,
  messages,
  status,
  onSubmitAwaitingInputs,
}: SessionMessageListProps) {
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedChunk, setSelectedChunk] = useState<ReferenceChunk | null>(null)
  const [detailChunks, setDetailChunks] = useState<ReferenceChunk[]>([])

  const handleViewDetail = useCallback(
    (chunk: ReferenceChunk, chunks: ReferenceChunk[]) => {
      setSelectedChunk(chunk)
      setDetailChunks(chunks)
      setDetailOpen(true)
    },
    [],
  )

  const handleCopyContent = useCallback(async (content: string) => {
    try {
      await copyToClipboard(content)
      toast.success('已复制到剪贴板')
    } catch {
      toast.error('复制失败')
    }
  }, [])

  const bubbleItems = useMemo(() => {
    return messages.map((message, index) => {
      const isUser = message.role === 'user'
      const isLatest = index === messages.length - 1
      const references = getReferenceChunks(message.reference)
      const fallback = extractThinkContent(message.content || '')
      const thinkContent = message.thinking || fallback.thinkContent
      const mainContent =
        message.thinking !== undefined ? message.content : fallback.mainContent
      const isStreaming = Boolean(message.isStreaming)
      const thinkingStatus: ThinkingStatus = thinkContent
        ? isStreaming
          ? 'thinking'
          : 'complete'
        : 'none'
      const { content: processedContent, carouselGroups } =
        processContentForCarousel(mainContent, references)
      const contentWithSup = references.length
        ? convertReferencesToSup(processedContent)
        : processedContent
      const SupComponent = references.length
        ? createReferenceMarkerComponent(references, {
            onViewDetail: (chunk) => handleViewDetail(chunk, references),
            onCopy: (content) => {
              void handleCopyContent(content)
            },
          })
        : undefined

      const renderContentWithCarousels = () => {
        if (!contentWithSup.trim()) {
          return null
        }

        if (carouselGroups.length === 0) {
          return (
            <SessionMarkdown
              content={contentWithSup}
              streaming={isStreaming}
              components={SupComponent ? { sup: SupComponent } : undefined}
            />
          )
        }

        const parts = contentWithSup.split(
          /<carousel-placeholder[^>]*><\/carousel-placeholder>/g,
        )
        return (
          <>
            {parts.map((part, partIndex) => (
              <Fragment key={`part-${partIndex}`}>
                {part.trim() ? (
                  <SessionMarkdown
                    content={part}
                    streaming={isStreaming}
                    components={SupComponent ? { sup: SupComponent } : undefined}
                  />
                ) : null}
                {partIndex < carouselGroups.length ? (
                  <CarouselWrapper
                    group={carouselGroups[partIndex]}
                    chunks={references}
                  />
                ) : null}
              </Fragment>
            ))}
          </>
        )
      }

      return {
        key: `${message.role}_${message.id || index}`,
        role: message.role,
        content: message.content || '',
        placement: isUser ? ('end' as const) : ('start' as const),
        avatar: isUser ? <UserAvatar /> : <AssistantAvatar />,
        loading: isStreaming && !thinkContent && !mainContent,
        streaming: isStreaming,
        footerPlacement: isUser ? undefined : ('outer-end' as const),
        variant: 'borderless' as const,
        styles: isUser
          ? {
              content: {
                backgroundColor: 'var(--color-chat-bubble-user-bg)',
                color: 'var(--color-chat-bubble-user-text)',
                borderRadius: '18px',
                padding: '12px 16px',
                maxWidth: 'min(640px, 100%)',
              },
            }
          : {
              content: {
                backgroundColor: 'transparent',
                color: 'var(--color-text-primary)',
                border: 'none',
                boxShadow: 'none',
                padding: '0',
              },
            },
        contentRender: () => (
          <div className="space-y-space-sm">
            {isUser ? (
              <>
                {message.content ? (
                  <div className="whitespace-pre-wrap break-words text-sm">
                    {message.content}
                  </div>
                ) : null}
                <RuntimeAttachmentList message={message} />
              </>
            ) : (
              <>
                {thinkContent ? (
                  <ThinkWrapper status={thinkingStatus} messageId={message.id}>
                    <div className="whitespace-pre-wrap text-sm text-text-secondary">
                      {thinkContent}
                    </div>
                  </ThinkWrapper>
                ) : null}

                {renderContentWithCarousels()}

                {isStreaming && !thinkContent && !mainContent ? (
                  <BubbleLoading prefixCls="ant-bubble" />
                ) : null}

                <RuntimeAttachmentList message={message} />

                {references.length && !isStreaming ? (
                  <ReferenceImageList
                    referenceChunks={references}
                    messageContent={mainContent}
                    className="mt-space-base"
                    onImageClick={(chunk) => handleViewDetail(chunk, references)}
                  />
                ) : null}

                {references.length && !isStreaming ? (
                  <ReferencePanel
                    chunks={references}
                    onChunkClick={(chunk) => handleViewDetail(chunk, references)}
                    defaultVisiblePerDoc={2}
                  />
                ) : null}

                {message.awaitingInputs?.length && isLatest ? (
                  <div className="mt-space-md rounded-radius-md border border-border-primary bg-surface-primary p-space-sm">
                    <DebugContent
                      canvasId={canvasId}
                      parameters={message.awaitingInputs}
                      ok={(values) => onSubmitAwaitingInputs(message.id, values)}
                      isNext={false}
                      loading={status === AgentRuntimeStatus.RUNNING}
                      btnText="提交继续运行"
                      className="min-h-0"
                      maxHeight="max-h-none"
                    />
                  </div>
                ) : null}

                {message.error ? (
                  <p className="text-xs text-status-error">{message.error}</p>
                ) : null}
              </>
            )}
          </div>
        ),
        footer:
          !isUser && !isStreaming ? (
            <MessageActionsFooter
              content={mainContent}
              onCopy={() => {
                void handleCopyContent(mainContent)
              }}
              showRegenerate={false}
              showFeedback={false}
            />
          ) : undefined,
      }
    })
  }, [canvasId, handleCopyContent, handleViewDetail, messages, onSubmitAwaitingInputs, status])

  return (
    <>
      <div className="agent-explore-session-chat mx-auto w-full max-w-4xl px-space-lg py-space-lg">
        <Bubble.List
          items={bubbleItems as Parameters<typeof Bubble.List>[0]['items']}
          autoScroll
          style={{ minHeight: '100%', paddingBottom: '8px' }}
        />
      </div>
      <ReferenceDetailSheet
        open={detailOpen}
        onOpenChange={setDetailOpen}
        chunk={selectedChunk}
        allChunks={detailChunks}
      />
    </>
  )
}
