import { memo, useEffect, useState } from 'react'
import { ChevronRight, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { markdownConfig } from './MarkdownCodeBlock'
import { StreamingXMarkdown } from './streaming-x-markdown'
import '@/components/chat/app-chat-message.css'

/**
 * Seconds spent thinking, measured on this device while the reasoning streams
 * (the backend only sends start and end frames). History has no timing, so it
 * returns null and the line reads “Thought” without a number.
 */
function useThinkingSeconds(active: boolean) {
  const [startedAt, setStartedAt] = useState<number | null>(() =>
    active ? Date.now() : null,
  )
  const [now, setNow] = useState(startedAt)
  useEffect(() => {
    if (!active) return undefined
    const tick = () => {
      const time = Date.now()
      setStartedAt((start) => start ?? time)
      setNow(time)
    }
    const timer = setInterval(tick, 1000)
    return () => {
      clearInterval(timer)
      tick()
    }
  }, [active])
  if (startedAt === null || now === null) return null
  return Math.max(1, Math.round((now - startedAt) / 1000))
}

export interface ReasoningDisclosureProps {
  /** Model reasoning (Markdown). Untrusted model output, never HTML. */
  content: string
  /** Still receiving reasoning. */
  thinking: boolean
  /** Thinking time when the data provides it; otherwise measured locally. */
  seconds?: number
}

/** One collapsed line (“Thought for 6 s”); Markdown when the reader expands it. */
export const ReasoningDisclosure = memo(function ReasoningDisclosure({
  content,
  thinking,
  seconds,
}: ReasoningDisclosureProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const measured = useThinkingSeconds(thinking)
  const elapsed = seconds ?? measured
  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      data-reasoning={thinking ? 'thinking' : 'complete'}
      className="text-sm text-text-secondary"
    >
      <CollapsibleTrigger className="group inline-flex min-h-[var(--control-height-sm)] max-w-full items-center gap-space-xs rounded-radius-sm text-start hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-state-focus">
        <Sparkles
          aria-hidden="true"
          className="size-icon-sm shrink-0 text-text-tertiary"
        />
        {thinking ? (
          <span aria-live="polite" className="chat-shimmer">
            {t('chat.thread.thinking')}
          </span>
        ) : (
          <span>
            {elapsed
              ? t('chat.thread.thoughtFor', { count: elapsed })
              : t('chat.thread.thought')}
          </span>
        )}
        {thinking && elapsed && (
          <span className="font-mono text-xs text-text-tertiary">
            {t('chat.thread.seconds', { count: elapsed })}
          </span>
        )}
        <ChevronRight
          aria-hidden="true"
          className="size-icon-xs shrink-0 text-text-tertiary transition-transform group-data-[state=open]:rotate-90 motion-reduce:transition-none"
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-space-xs border-s border-border-default ps-space-md text-text-secondary">
        <div className="reasoning-markdown prose prose-sm max-w-none text-text-secondary">
          <StreamingXMarkdown
            paragraphTag="div"
            config={markdownConfig}
            content={content}
            isStreaming={thinking}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
})
