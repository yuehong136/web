import { forwardRef } from 'react'
import Sender from '@ant-design/x/es/sender'
import type { SenderProps, SenderRef } from '@ant-design/x/es/sender/interface'
import { cn } from '@/lib/utils'
import '@/components/chat/app-chat-composer.css'

/** One input surface for application conversations and Studio test chat. */
export const AppChatComposer = forwardRef<SenderRef, SenderProps>(
  function AppChatComposer({ rootClassName, ...props }, ref) {
    return (
      <Sender
        {...props}
        ref={ref}
        rootClassName={cn('app-chat-composer', rootClassName)}
      />
    )
  },
)
