import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { RuntimeMessageBubble } from '@/pages/agent/components/runtime-message-bubble'
import { normalizeRuntimeAttachments } from '../../runtime-workbench/utils'
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
          <div className="space-y-space-md">
            {messages.map((message, index) => (
              <RuntimeMessageBubble
                key={message.id || `${message.role || 'message'}-${index}`}
                message={{
                  role: message.role,
                  content: message.content,
                  files: normalizeRuntimeAttachments(message.files),
                  error:
                    typeof message.error === 'string'
                      ? message.error
                      : undefined,
                }}
              />
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
