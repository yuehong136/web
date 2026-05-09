import { RuntimeChatMessageList } from '@/pages/agent/components/runtime-chat'
import { AgentRuntimeStatus } from '@/pages/agent/features/runtime-workbench/types'
import { mapSessionMessageToRuntimeMessage } from '@/pages/agent/explore/utils'
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
      messages={messages.map((message, index) =>
        mapSessionMessageToRuntimeMessage(message, index),
      )}
      status={AgentRuntimeStatus.IDLE}
      density="compact"
      onSubmitAwaitingInputs={() => undefined}
    />
  )
}
