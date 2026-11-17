import { useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChatTranscript,
  type TranscriptItem,
} from '@/components/chat/chat-transcript'
import {
  MessageParts,
  type MessagePartsProps,
} from '@/components/chat/message-parts'
import { ContextManifestSummary } from '@/components/chat/context-manifest-summary'
import { MessageActionsFooter } from '@/components/chat/MessageActionsFooter'
import { ChatWorkspace } from '@/components/chat/chat-workspace'
import type { ChatComposerRef } from '@/components/chat/chat-composer'
import { useChatWorkspace } from '@/components/chat/chat-workspace-context'
import { ChatThreadHeader } from '@/components/chat/chat-thread-header'
import { TurnRail, type ThreadTurn } from '@/components/chat/turn-rail'
import { useAuthStore } from '@/stores/auth'
import { ChatScrollViewport } from '@/components/patterns/chat/chat-scroll-viewport'
import { PageLoadingState } from '@/components/patterns/page-states'
import { useFetchMyLLMs } from '@/hooks/use-llm-request'
import { homeMessageIdentity } from '../utils/model-identity'
import { useHomeStore } from '@/stores/home'
import { createTimelineNodesFromToolCalls } from '@/lib/streaming'
import { copyToClipboardWithFeedback } from '@/lib/clipboard'
import { extractThinkContent } from '@/utils/think-utils'
import { AnswerStatusNotice } from './answer-status-notice'
import { HomeComposer } from './home-composer'
import { ComposerEntrance, type ComposerOrigin } from './composer-entrance'
import { renderHomeThreadIdentity } from './home-thread-identity'
import { getHomeMessagePhase } from '../utils/answer-status'
import type { ChatMessage } from '../types'
import type { HomeLocalThread } from '../hooks/use-home-local-threads'
import { useHomeChatOptions } from '../hooks/use-home-chat-options'
import { HomeThreadActions } from './local-threads'

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
  /** Where the welcome composer was when this conversation's first message left it. */
  composerOrigin?: ComposerOrigin | null
  /** Model and MCP conversations set aside during this visit. */
  localThreads?: HomeLocalThread[]
  onOpenLocalThread?: (id: string) => void
  /** Model and MCP chats only; app conversations start from the shell panel. */
  onNewChat?: () => void
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
  composerOrigin = null,
  localThreads = [],
  onOpenLocalThread = () => {},
  onNewChat,
}: ChatSectionProps) {
  const { t } = useTranslation()
  const composer = useRef<ChatComposerRef>(null)
  const workspace = useChatWorkspace()!
  const { myLLMs } = useFetchMyLLMs()
  const { viewReference } = workspace
  const openEvidence = useCallback<MessagePartsProps['onViewReference']>(
    (chunk, references, options) =>
      viewReference(chunk, references, options?.messageId, options),
    [viewReference],
  )
  const thread = useRef<HTMLDivElement>(null)
  const selectedApp = useHomeStore((state) => state.selectedApps[0])
  const selectedModelId = useHomeStore((state) => state.selectedModelId)
  const fullWidth = useHomeChatOptions((state) => state.fullWidth)
  const column = fullWidth ? 'w-full' : 'mx-auto w-full max-w-2xl'
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
      // Every answer names its model with the provider logo, then the time.
      const identity = user
        ? undefined
        : {
            ...homeMessageIdentity(
              message.contextManifest,
              myLLMs,
              message.modelIdentity,
            ),
            time: message.timestamp,
          }
      return {
        id: message.id,
        role: message.role,
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
            onViewReference={openEvidence}
            identity={identity}
          />
        ),
        actions:
          !active && Boolean(content.trim()) ? (
            <MessageActionsFooter
              className="flex"
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
        body: (
          <MessageParts
            content={streamingContent}
            thinking={streamingThinking}
            run={{ phase: 'running' }}
            onViewReference={openEvidence}
          />
        ),
      })
    return rows
  }, [
    messages,
    isStreaming,
    myLLMs,
    openEvidence,
    copy,
    streamingContent,
    streamingThinking,
  ])
  const turns = useMemo<ThreadTurn[]>(
    () =>
      messages
        .filter((message) => message.role === 'user')
        .map((message) => ({ id: message.id, question: message.content })),
    [messages],
  )
  const title = turns[0]?.question.trim()
  return (
    <div className="app-chat-area home-chat-area flex min-h-0 flex-1 flex-col">
      <ChatThreadHeader
        title={title || t('chat.thread.newChat')}
        placeholder={!title}
        identity={renderHomeThreadIdentity({
          app: selectedApp,
          messages,
          providers: myLLMs ?? {},
          selectedModelId,
        })}
        actions={
          <HomeThreadActions
            threads={localThreads}
            onOpen={onOpenLocalThread}
            onNewChat={onNewChat}
          />
        }
      />
      <div ref={thread} className="relative flex min-h-0 flex-1 flex-col">
        <ChatScrollViewport
          anchorKey={
            messages.findLast((message) => message.role === 'user')?.id
          }
          pending={isSendPending}
          isStreaming={isStreaming}
          className="px-space-md pb-space-lg sm:px-space-lg"
          contentClassName={column}
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
        <TurnRail turns={turns} rootRef={thread} />
      </div>
      <div className="shrink-0 px-space-sm pt-space-xs pb-space-sm sm:px-space-lg sm:pb-space-md">
        <ComposerEntrance
          origin={composerOrigin}
          focusTarget={composer}
          className={column}
        >
          <HomeComposer
            inputRef={composer}
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
        </ComposerEntrance>
      </div>
    </div>
  )
}
