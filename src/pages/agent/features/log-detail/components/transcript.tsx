import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { RuntimeChatMessageList } from '@/pages/agent/components/runtime-chat'
import { AgentRuntimeStatus } from '@/pages/agent/features/runtime-workbench'
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
    <Accordion type="single" collapsible>
      <AccordionItem value="transcript" className="border-border-primary">
        <AccordionTrigger className="py-space-sm text-sm text-text-primary hover:no-underline">
          Transcript（{messages.length}）
        </AccordionTrigger>
        <AccordionContent>
          <RuntimeChatMessageList
            canvasId=""
            messages={messages.map((message, index) =>
              mapSessionMessageToRuntimeMessage(message, index),
            )}
            status={AgentRuntimeStatus.IDLE}
            density="compact"
            onSubmitAwaitingInputs={() => undefined}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
