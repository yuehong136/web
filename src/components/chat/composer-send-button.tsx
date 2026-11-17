import { useState } from 'react'
import { ArrowUp, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import '@/components/chat/composer-send-button.css'

export interface ComposerSendButtonProps {
  /** A reply is streaming: the button stops it instead of sending. */
  running: boolean
  /** The draft can be sent now; ignored while running. */
  canSend: boolean
  onSend: () => void
  onStop: () => void
  sendLabel: string
  stopLabel: string
  size?: 'icon' | 'icon-sm'
  /** Stop's look; send always uses the primary button. */
  stopVariant?: 'secondary' | 'destructive'
  className?: string
}

/**
 * Send and stop are one button. While a reply streams it morphs into stop
 * (icons cross-fade with a slight scale, ~160ms; see the stylesheet) and back,
 * so its position, size and focus survive the switch and only its accessible
 * name changes. A send that becomes unavailable while focused stays focusable
 * (`aria-disabled`) until focus leaves, then it is natively disabled again.
 */
export function ComposerSendButton({
  running,
  canSend,
  onSend,
  onStop,
  sendLabel,
  stopLabel,
  size = 'icon',
  stopVariant = 'secondary',
  className,
}: ComposerSendButtonProps) {
  const [focused, setFocused] = useState(false)
  const unavailable = !running && !canSend
  const label = running ? stopLabel : sendLabel
  return (
    <Button
      type="button"
      size={size}
      variant={running ? stopVariant : 'default'}
      data-composer-send
      data-state={running ? 'stop' : 'send'}
      className={cn(
        'composer-send-button aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
        className,
      )}
      disabled={unavailable && !focused}
      aria-disabled={unavailable || undefined}
      aria-label={label}
      title={label}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onClick={(event) => {
        // The second click of a double-click on send lands on the stop it
        // just became; only a deliberate click stops the reply.
        if (running) {
          if (event.detail < 2) onStop()
        } else if (canSend) onSend()
      }}
    >
      <ArrowUp data-icon="send" aria-hidden="true" className="size-icon-sm" />
      <Square data-icon="stop" aria-hidden="true" className="size-icon-sm" />
    </Button>
  )
}
