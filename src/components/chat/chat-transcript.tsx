import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { RunPhase } from '@/lib/streaming'
import { MessageActionBar } from './message-action-bar'
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
}

/**
 * One reading column: answers without a bubble or avatar, user turns as a
 * compact bubble. The surrounding viewport owns scrolling and the live region;
 * the conversation header shows who answers, once.
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
          <article
            className="chat-transcript-message"
            aria-label={t(`chat.transcript.${item.role}`)}
          >
            <div
              className="chat-message-body"
              aria-busy={item.phase === 'running' || undefined}
            >
              {item.body}
            </div>
            <MessageActionBar
              meta={item.meta}
              persistent={item.id === lastAnswer}
            >
              {item.actions}
            </MessageActionBar>
          </article>
        </li>
      ))}
    </ol>
  )
}
