import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { RunPhase } from '@/lib/streaming'
import {
  Message,
  MessageActions,
  MessageContent,
  MessageToolbar,
} from '@/components/patterns/chat/message'
import '@/components/chat/app-chat-message.css'

export interface TranscriptItem {
  id: string
  role: 'user' | 'assistant'
  phase?: RunPhase
  body: ReactNode
  /** Copy, read aloud, retry… Only the latest answer keeps them visible. */
  actions?: ReactNode
  /** One line of meta, e.g. the answering model and time. */
  meta?: ReactNode
  /** Beside the message, e.g. the app and the user in Studio's test chat. */
  avatar?: ReactNode
}

/**
 * One reading column: answers without a bubble, user turns as a compact
 * bubble. Home, Explore and Studio's test chat all render their threads with
 * it. The surrounding viewport owns scrolling and the live region; questions
 * carry `data-turn-id` for anchoring and the turn rail.
 */
export function ChatTranscript({ items }: { items: TranscriptItem[] }) {
  const { t } = useTranslation()
  const lastAnswer = items.findLast((item) => item.role === 'assistant')?.id
  return (
    <ol className="chat-transcript" aria-label={t('chat.scroll.region')}>
      {items.map((item) => (
        <li
          key={item.id}
          data-message-id={item.id}
          data-message-role={item.role}
          data-run-phase={item.phase}
          data-turn-id={item.role === 'user' ? item.id : undefined}
        >
          <Message
            from={item.role}
            avatar={item.avatar}
            aria-label={t(`chat.transcript.${item.role}`)}
          >
            <MessageContent aria-busy={item.phase === 'running' || undefined}>
              {item.body}
            </MessageContent>
            {(item.actions || item.meta) && (
              <MessageActions persistent={item.id === lastAnswer}>
                {item.actions}
                {item.meta && <MessageToolbar>{item.meta}</MessageToolbar>}
              </MessageActions>
            )}
          </Message>
        </li>
      ))}
    </ol>
  )
}
