import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Bot, User } from 'lucide-react'
import {
  ChatTranscript,
  type TranscriptItem,
} from '@/components/chat/chat-transcript'
import { MessageParts } from '@/components/chat/message-parts'
import { ContextManifestSummary } from '@/components/chat/context-manifest-summary'
import { MessageActionsFooter } from '@/components/chat/MessageActionsFooter'
import { ChatWorkspace } from '@/components/chat/chat-workspace'
import { useChatWorkspace } from '@/components/chat/chat-workspace-context'
import { useAuthStore } from '@/stores/auth'
import { ChatScrollViewport } from '@/components/patterns/chat/chat-scroll-viewport'
import { ProviderIcon } from '@/components/ui/provider-icon'
import { PageLoadingState } from '@/components/patterns/page-states'
import { useFetchMyLLMs } from '@/hooks/use-llm-request'
import { findProviderNameByModelName } from '@/stores/model'
import { useHomeStore } from '@/stores/home'
import { createTimelineNodesFromToolCalls } from '@/lib/streaming'
import { copyToClipboardWithFeedback } from '@/lib/clipboard'
import { extractThinkContent } from '@/utils/think-utils'
import { AnswerStatusNotice } from './answer-status-notice'
import { HomeComposer } from './home-composer'
import { getHomeMessagePhase } from '../utils/answer-status'
import type { ChatMessage } from '../types'

interface ChatSectionProps {
  messages: ChatMessage[]
  inputValue: string
  onInputChange: (value: string) => void
  onSend: () => void
  onStop: () => void
  isStreaming: boolean
  streamingContent: string
  streamingThinking?: string
  isToolAnalyzing: boolean
  isLoadingHistory?: boolean
  isSendPending?: boolean
}

export function ChatSection(props: ChatSectionProps) {
  const user = useAuthStore((state) => state.user)
  const appId = useHomeStore((state) => state.selectedApps[0]?.id)
  const conversationId = useHomeStore((state) => state.selectedConversationId)
  return (
    <ChatWorkspace
      scopeKey={`${user?.id ?? ''}:${user?.tenant_id ?? ''}:${appId ?? ''}:${conversationId ?? ''}`}
    >
      <ChatSectionContent {...props} />
    </ChatWorkspace>
  )
}

function ChatSectionContent({
  messages,
  inputValue,
  onInputChange,
  onSend,
  onStop,
  isStreaming,
  streamingContent,
  streamingThinking = '',
  isLoadingHistory = false,
  isSendPending = false,
}: ChatSectionProps) {
  const { t } = useTranslation()
  const workspace = useChatWorkspace()!
  const { myLLMs } = useFetchMyLLMs()
  const selectedModelId = useHomeStore((state) => state.selectedModelId)
  const selectedApp = useHomeStore((state) => state.selectedApps[0])
  const provider = findProviderNameByModelName(myLLMs, selectedModelId, true)
  const viewReference = workspace.viewReference
  const copy = useCallback(
    (text: string) =>
      void copyToClipboardWithFeedback(
        text,
        t('common.copied'),
        t('common.copyFailed'),
      ),
    [t],
  )
  const items = useMemo<TranscriptItem[]>(() => {
    const rows = messages.map((message, index): TranscriptItem => {
      const active =
        isStreaming &&
        index === messages.length - 1 &&
        message.role === 'assistant'
      const phase = getHomeMessagePhase(message, active)
      const user = message.role === 'user'
      const content = user
        ? message.content
        : extractThinkContent(message.content).mainContent
      const steps = message.timelineNodes?.length
        ? message.timelineNodes
        : message.parsedToolCalls?.length
          ? createTimelineNodesFromToolCalls(message.parsedToolCalls)
          : undefined
      const submittedLabel = message.contextManifest?.resources.find(
        (resource) => resource.kind === 'app' || resource.kind === 'model',
      )?.label
      return {
        id: message.id,
        role: message.role,
        timestamp: message.timestamp,
        label: user
          ? t('chat.transcript.user')
          : submittedLabel ||
            selectedApp?.name ||
            provider ||
            t('chat.transcript.assistant'),
        identity: user ? (
          <User className="size-icon-md text-text-secondary" />
        ) : provider && !selectedApp ? (
          <ProviderIcon provider={provider} size={24} className="size-6" />
        ) : (
          <Bot className="size-6 text-text-secondary" />
        ),
        phase: user ? undefined : phase,
        body: user ? (
          <div className="space-y-space-sm">
            {message.content}
            {message.contextManifest && (
              <ContextManifestSummary manifest={message.contextManifest} />
            )}
          </div>
        ) : (
          <MessageParts
            content={message.content}
            thinking={message.thinking}
            messageId={message.id}
            references={message.references}
            contextManifest={message.contextManifest}
            run={{ phase, steps }}
            notice={<AnswerStatusNotice status={message.status} />}
            onViewReference={viewReference}
          />
        ),
        actions:
          !active && Boolean(content.trim()) ? (
            <MessageActionsFooter
              content={content}
              onCopy={() => copy(content)}
              showTTS={!user}
              showRegenerate={false}
              showFeedback={false}
            />
          ) : undefined,
      }
    })
    if (isStreaming && messages.at(-1)?.role !== 'assistant')
      rows.push({
        id: 'streaming-assistant',
        role: 'assistant',
        phase: 'running',
        identity: <Bot className="size-6 text-text-secondary" />,
        body: (
          <MessageParts
            content={streamingContent}
            thinking={streamingThinking}
            run={{ phase: 'running' }}
            onViewReference={viewReference}
          />
        ),
      })
    return rows
  }, [
    messages,
    isStreaming,
    provider,
    selectedApp,
    t,
    viewReference,
    copy,
    streamingContent,
    streamingThinking,
  ])
  return (
    <div className="app-chat-area home-chat-area flex min-h-0 flex-1 flex-col">
      <ChatScrollViewport
        followKey={messages.findLast((message) => message.role === 'user')?.id}
        isStreaming={isStreaming}
        className="px-space-md pb-space-lg sm:px-space-lg"
        contentClassName="mx-auto w-full max-w-3xl"
      >
        {isLoadingHistory ? (
          <PageLoadingState
            title={t('home.input.loadingHistory')}
            description={null}
          />
        ) : (
          <ChatTranscript items={items} />
        )}
      </ChatScrollViewport>
      <div className="shrink-0 px-space-md pt-space-sm pb-space-md sm:px-space-lg">
        <div className="mx-auto w-full max-w-3xl">
          <HomeComposer
            value={inputValue}
            onChange={onInputChange}
            onSend={onSend}
            placement="conversation"
            sendBlocked={isLoadingHistory}
            request={
              isStreaming
                ? { phase: 'running', stop: onStop }
                : { phase: isSendPending ? 'preparing' : 'idle' }
            }
          />
        </div>
      </div>
    </div>
  )
}
