import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { RunPhase } from '@/lib/streaming'
import '@/components/chat/app-chat-message.css'

export interface TranscriptItem {
  id: string
  role: 'user' | 'assistant'
  identity?: ReactNode
  label?: string
  timestamp?: string
  phase?: RunPhase
  body: ReactNode
  actions?: ReactNode
}

/** The surrounding viewport owns scrolling and the live region. */
export function ChatTranscript({ items }: { items: TranscriptItem[] }) {
  const { t } = useTranslation()
  return (
    <ol className="chat-transcript" aria-label={t('chat.scroll.region')}>
      {items.map((item) => (
        <li
          key={item.id}
          data-message-id={item.id}
          data-message-role={item.role}
          data-run-phase={item.phase}
        >
          <article className="chat-transcript-message">
            <div className="chat-message-identity" aria-hidden="true">
              {item.identity}
            </div>
            <div className="chat-message-main">
              <div className="chat-message-heading">
                <span>{item.label ?? t(`chat.transcript.${item.role}`)}</span>
                {item.timestamp && (
                  <time className="text-xs font-normal text-text-tertiary">
                    {item.timestamp}
                  </time>
                )}
              </div>
              <div
                className="chat-message-body"
                aria-busy={item.phase === 'running' || undefined}
              >
                {item.body}
              </div>
              {item.actions && (
                <div className="chat-message-footer">{item.actions}</div>
              )}
            </div>
          </article>
        </li>
      ))}
    </ol>
  )
}
