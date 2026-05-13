import { PageEmptyState, AppScene } from '@/components/patterns'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()

  if (!messages.length) {
    return (
      <div className="p-space-lg flex min-h-[320px] items-center justify-center">
        <PageEmptyState
          scene={AppScene.WORKSPACE}
          compact
          title={title || t('agent.share.agentShare', 'Agent Share')}
          description={
            prologue ||
            t(
              'agent.share.emptyDescription',
              'Type a message or submit parameters to start.',
            )
          }
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
