import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AppScene, PageEmptyState } from '@/components/patterns'
import { ChatScrollViewport } from '@/components/patterns/chat/chat-scroll-viewport'
import {
  AgentRuntimeStatus,
  type RuntimeAttachment,
  type RuntimeMessage,
} from '../../features/runtime-workbench/types'
import type { BeginQuery } from '../../types'
import type { AgentXCardActionPayload } from '../../x-card'
import { RuntimeChatComposer } from './runtime-chat-composer'
import { RuntimeChatMessageList } from './runtime-chat-message-list'
import type { RuntimeChatComposerMode, RuntimeChatSendRequest } from './types'

interface RuntimeChatPanelProps {
  canvasId?: string
  userAvatar?: ReactNode
  userId?: string
  messages: RuntimeMessage[]
  status: AgentRuntimeStatus
  isTaskMode?: boolean
  composerMode: RuntimeChatComposerMode
  density?: 'comfortable' | 'compact'
  emptyTitle?: string
  emptyDescription?: string
  taskModeEmptyTitle?: string
  taskModeEmptyDescription?: string
  onSend: (request: RuntimeChatSendRequest) => Promise<void>
  onStop: () => Promise<void>
  onSubmitAwaitingInputs: (
    messageId: string,
    values: BeginQuery[],
  ) => void | Promise<void>
  onXCardAction?: (payload: AgentXCardActionPayload) => void | Promise<void>
  onDownloadAttachment?: (file: RuntimeAttachment) => void | Promise<void>
}

export function RuntimeChatPanel({
  canvasId,
  messages,
  userAvatar,
  userId,
  status,
  isTaskMode = false,
  composerMode,
  density = 'comfortable',
  emptyTitle,
  emptyDescription,
  taskModeEmptyTitle,
  taskModeEmptyDescription,
  onSend,
  onStop,
  onSubmitAwaitingInputs,
  onXCardAction,
  onDownloadAttachment,
}: RuntimeChatPanelProps) {
  const { t } = useTranslation()
  const showComposer =
    composerMode !== 'hidden' && !isTaskMode && Boolean(canvasId)
  const isCompact = density === 'compact'

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col bg-surface">
      <div className="flex min-h-0 flex-1 flex-col">
        {messages.length === 0 ? (
          <div className="flex h-full min-h-[240px] items-center justify-center p-space-lg">
            <PageEmptyState
              scene={AppScene.WORKSPACE}
              compact={isCompact}
              title={
                isTaskMode
                  ? (taskModeEmptyTitle ??
                    t('agent.runtimePanel.chatPanel.taskModeTitle'))
                  : (emptyTitle ?? t('agent.runtimePanel.chatPanel.emptyTitle'))
              }
              description={
                isTaskMode
                  ? (taskModeEmptyDescription ??
                    t('agent.runtimePanel.chatPanel.taskModeDescription'))
                  : (emptyDescription ??
                    t('agent.runtimePanel.chatPanel.emptyDescription'))
              }
            />
          </div>
        ) : (
          // A sent question is anchored near the top while the run answers.
          <ChatScrollViewport
            anchorKey={
              messages.findLast((message) => message.role === 'user')?.id
            }
            isStreaming={status === AgentRuntimeStatus.RUNNING}
            className="h-full"
          >
            <RuntimeChatMessageList
              canvasId={canvasId || ''}
              messages={messages}
              userAvatar={userAvatar}
              userId={userId}
              status={status}
              density={density}
              onSubmitAwaitingInputs={onSubmitAwaitingInputs}
              onXCardAction={onXCardAction}
              onDownloadAttachment={onDownloadAttachment}
            />
          </ChatScrollViewport>
        )}
      </div>

      {showComposer ? (
        <RuntimeChatComposer
          canvasId={canvasId}
          status={status}
          disabled={Boolean(messages.at(-1)?.awaitingInputs?.length)}
          isTaskMode={isTaskMode}
          density={composerMode === 'compact' ? 'compact' : density}
          placeholder={t('agent.runtimePanel.chatPanel.placeholder')}
          onSend={onSend}
          onStop={onStop}
        />
      ) : null}
    </section>
  )
}
