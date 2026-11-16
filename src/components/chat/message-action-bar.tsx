import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import '@/components/chat/app-chat-message.css'

export interface MessageActionBarProps {
  children?: ReactNode
  /** One line of message meta (model · time), after the buttons. */
  meta?: ReactNode
  /**
   * Keep the bar visible. Only the latest answer does; earlier messages reveal
   * their actions on hover or keyboard focus (always on touch screens).
   */
  persistent?: boolean
  className?: string
}

/** Copy, read aloud, retry… plus one consistent meta style for every thread. */
export function MessageActionBar({
  children,
  meta,
  persistent = false,
  className,
}: MessageActionBarProps) {
  if (!children && !meta) return null
  return (
    <div
      className={cn('chat-message-actions', className)}
      data-persistent={persistent || undefined}
    >
      {children}
      {meta && <span className="chat-message-meta">{meta}</span>}
    </div>
  )
}
