import { PageEmptyState, AppScene } from '@/components/patterns'
import { RuntimeChatMessageList } from '../components/runtime-chat'
import {
  AgentRuntimeStatus,
  type RuntimeAttachment,
} from '../features/runtime-workbench/types'
import type { AgentXCardActionPayload } from '../x-card'
import type { BeginQuery } from '../types'
import type { ShareRuntimeMessage } from './types'

interface ShareMessageListProps {
  canvasId: string
  messages: ShareRuntimeMessage[]
  status: AgentRuntimeStatus
  title?: string
  prologue?: string
  onSubmitAwaitingInputs: (
    messageId: string,
    values: BeginQuery[],
  ) => void | Promise<void>
  onXCardAction?: (payload: AgentXCardActionPayload) => void | Promise<void>
  onDownloadAttachment?: (file: RuntimeAttachment) => void | Promise<void>
}

export function ShareMessageList({
  canvasId,
  messages,
  status,
  title,
  prologue,
  onSubmitAwaitingInputs,
  onXCardAction,
  onDownloadAttachment,
}: ShareMessageListProps) {
  if (!messages.length) {
    return (
      <div className="flex min-h-[320px] items-center justify-center p-space-lg">
        <PageEmptyState
          scene={AppScene.WORKSPACE}
          compact
          title={title || 'Agent Share'}
          description={prologue || '输入消息或提交参数后开始公共运行。'}
        />
      </div>
    )
  }

  return (
    <RuntimeChatMessageList
      canvasId={canvasId}
      messages={messages}
      status={status}
      onSubmitAwaitingInputs={onSubmitAwaitingInputs}
      onXCardAction={onXCardAction}
      onDownloadAttachment={onDownloadAttachment}
    />
  )
}
