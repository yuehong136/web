import { AppScene, PageEmptyState } from '@/components/patterns'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  status,
  isTaskMode = false,
  composerMode,
  density = 'comfortable',
  emptyTitle = '还没有消息',
  emptyDescription = '发送第一条消息后开始会话。',
  taskModeEmptyTitle = '任务模式会话',
  taskModeEmptyDescription = '请先在运行页提交开始输入，运行后这里会展示消息与执行链路。',
  onSend,
  onStop,
  onSubmitAwaitingInputs,
  onXCardAction,
  onDownloadAttachment,
}: RuntimeChatPanelProps) {
  const showComposer =
    composerMode !== 'hidden' && !isTaskMode && Boolean(canvasId)
  const isCompact = density === 'compact'

  return (
    <section className="bg-surface-primary flex h-full min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1">
        {messages.length === 0 ? (
          <div className="p-space-lg flex h-full min-h-[240px] items-center justify-center">
            <PageEmptyState
              scene={AppScene.WORKSPACE}
              compact={isCompact}
              title={isTaskMode ? taskModeEmptyTitle : emptyTitle}
              description={
                isTaskMode ? taskModeEmptyDescription : emptyDescription
              }
            />
          </div>
        ) : (
          <ScrollArea className="h-full">
            <RuntimeChatMessageList
              canvasId={canvasId || ''}
              messages={messages}
              status={status}
              density={density}
              onSubmitAwaitingInputs={onSubmitAwaitingInputs}
              onXCardAction={onXCardAction}
              onDownloadAttachment={onDownloadAttachment}
            />
          </ScrollArea>
        )}
      </div>

      {showComposer ? (
        <RuntimeChatComposer
          canvasId={canvasId}
          status={status}
          isTaskMode={isTaskMode}
          density={composerMode === 'compact' ? 'compact' : density}
          placeholder="输入测试消息..."
          onSend={onSend}
          onStop={onStop}
        />
      ) : null}
    </section>
  )
}
