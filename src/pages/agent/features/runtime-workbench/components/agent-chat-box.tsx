import { EntityAvatar } from '@/components/patterns/entity-avatar'
import { useCurrentUserAvatar } from '@/hooks/use-current-user-avatar'
import { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from '@/lib/toast'
import { RuntimeChatPanel } from '../../../components/runtime-chat'
import { downloadRuntimeAttachment } from '../../../components/runtime-chat/download-runtime-attachment'
import type { AgentRuntimeController, RuntimeAttachment } from '../types'

interface AgentChatBoxProps {
  controller: AgentRuntimeController
}

function AgentChatBoxBase({ controller }: AgentChatBoxProps) {
  const { t } = useTranslation()
  const user = useCurrentUserAvatar()
  const handleDownloadAttachment = useCallback(
    async (file: RuntimeAttachment) => {
      try {
        await downloadRuntimeAttachment(file, t)
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : t('agent.runtimePanel.chatBox.downloadFailed'),
        )
      }
    },
    [t],
  )

  return (
    <RuntimeChatPanel
      canvasId={controller.canvasId}
      messages={controller.messages}
      userId={user.seed}
      userAvatar={<EntityAvatar {...user} shape="circle" />}
      status={controller.status}
      isTaskMode={controller.isTaskMode}
      composerMode={controller.isTaskMode ? 'hidden' : 'compact'}
      density="compact"
      emptyTitle={t('agent.runtimePanel.chatBox.emptyTitle')}
      emptyDescription={t('agent.runtimePanel.chatBox.emptyDescription')}
      taskModeEmptyTitle={t('agent.runtimePanel.chatPanel.taskModeTitle')}
      taskModeEmptyDescription={t(
        'agent.runtimePanel.chatBox.taskModeDescription',
      )}
      onSend={controller.handleSendMessage}
      onStop={controller.handleStop}
      onSubmitAwaitingInputs={controller.handleSubmitAwaitingInputs}
      onXCardAction={controller.handleXCardAction}
      onDownloadAttachment={handleDownloadAttachment}
    />
  )
}

export const AgentChatBox = memo(AgentChatBoxBase)
