import { RuntimeChatMessageList } from '@/pages/agent/components/runtime-chat'
import { AgentRuntimeStatus } from '@/pages/agent/features/runtime-workbench/types'
import { mapSessionMessageToRuntimeMessage } from '@/pages/agent/explore/utils'
import { splitRuntimeMessages } from '../../runtime-workbench/wait-messages'
import type { AgentSessionMessage } from '@/types/agent'

interface TranscriptProps {
  messages: AgentSessionMessage[]
}

export function Transcript({ messages }: TranscriptProps) {
  if (!messages.length) {
    return (
      <p className="text-sm text-text-secondary">
        当前会话没有可展示的消息记录。
      </p>
    )
  }

  return (
    <RuntimeChatMessageList
      canvasId=""
      messages={splitRuntimeMessages(
        messages.map((message, index) => ({
          ...mapSessionMessageToRuntimeMessage(message, index),
          awaitingInputs: undefined,
        })),
      )}
      status={AgentRuntimeStatus.IDLE}
      density="compact"
      onSubmitAwaitingInputs={() => undefined}
    />
  )
}
