import { memo, useCallback } from 'react'
import { toast } from '@/lib/toast'
import { RuntimeChatPanel } from '../components/runtime-chat'
import { downloadRuntimeAttachment } from '../components/runtime-chat/download-runtime-attachment'
import type {
  AgentRuntimeController,
  RuntimeAttachment,
} from '../features/runtime-workbench/types'

interface AgentChatBoxProps {
  controller: AgentRuntimeController
}

function AgentChatBox({ controller }: AgentChatBoxProps) {
  const handleDownloadAttachment = useCallback(
    async (file: RuntimeAttachment) => {
      try {
        await downloadRuntimeAttachment(file)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '附件下载失败')
      }
    },
    [],
  )

  return (
    <RuntimeChatPanel
      canvasId={controller.canvasId}
      messages={controller.messages}
      status={controller.status}
      isTaskMode={controller.isTaskMode}
      composerMode={controller.isTaskMode ? 'hidden' : 'compact'}
      density="compact"
      emptyTitle="还没有运行消息"
      emptyDescription="先在 Run 视图提交 Begin 输入，然后在这里发送测试消息。普通 Agent 会复用当前编辑器里的最新图谱。"
      taskModeEmptyTitle="任务模式会话"
      taskModeEmptyDescription="任务模式请先在 Run 视图提交 Begin 输入，运行后这里会展示消息与执行链路。"
      onSend={controller.handleSendMessage}
      onStop={controller.handleStop}
      onSubmitAwaitingInputs={controller.handleSubmitAwaitingInputs}
      onXCardAction={controller.handleXCardAction}
      onDownloadAttachment={handleDownloadAttachment}
    />
  )
}

export default memo(AgentChatBox)
