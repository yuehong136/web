/**
 * Message parts, adapted from Vercel AI Elements `message.tsx`
 * (https://github.com/vercel/ai-elements), Copyright 2023 Vercel, Inc.,
 * licensed under the Apache License, Version 2.0
 * (http://www.apache.org/licenses/LICENSE-2.0).
 *
 * Modified for this app: answers render with our own Markdown (XMarkdown)
 * and run parts instead of Streamdown, so `MessageResponse` and branches are
 * left out; an optional avatar slot; the thread look (answers without a
 * bubble, user turns as a compact bubble) comes from design tokens in
 * app-chat-message.css.
 */
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
  Ref,
} from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import '@/components/chat/app-chat-message.css'

export type MessageRole = 'user' | 'assistant'

export type MessageProps = HTMLAttributes<HTMLElement> & {
  from: MessageRole
  /** Shown beside the message (e.g. the app in Studio's test chat). */
  avatar?: ReactNode
}

/** One message: answers start-aligned, user turns end-aligned. */
export function Message({
  from,
  avatar,
  className,
  children,
  ...props
}: MessageProps) {
  return (
    <article
      data-from={from}
      data-has-avatar={avatar ? true : undefined}
      className={cn('chat-transcript-message', className)}
      {...props}
    >
      {avatar ? (
        <>
          <span className="chat-message-avatar">{avatar}</span>
          <div className="chat-message-column">{children}</div>
        </>
      ) : (
        children
      )}
    </article>
  )
}

/** The message text: a compact bubble for the user, plain for answers. */
export function MessageContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('chat-message-body', className)} {...props} />
}

export type MessageActionsProps = HTMLAttributes<HTMLDivElement> & {
  /**
   * Keep the actions visible. Only the latest answer does; earlier messages
   * reveal theirs on hover or keyboard focus (always on touch screens).
   */
  persistent?: boolean
}

export function MessageActions({
  persistent = false,
  className,
  ...props
}: MessageActionsProps) {
  return (
    <div
      className={cn('chat-message-actions', className)}
      data-persistent={persistent || undefined}
      {...props}
    />
  )
}

export type MessageActionProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** The accessible name, also shown as a tooltip. */
  label: string
  ref?: Ref<HTMLButtonElement>
}

/** An icon button in a message's actions, named for assistive tech. */
export function MessageAction({
  label,
  children,
  ...props
}: MessageActionProps) {
  return (
    <Tooltip content={label} asChild>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={label}
        {...props}
      >
        {children}
      </Button>
    </Tooltip>
  )
}

/** A line of meta after the actions, e.g. model and time. */
export function MessageToolbar({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('chat-message-meta', className)} {...props} />
}
