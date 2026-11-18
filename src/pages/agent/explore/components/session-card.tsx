import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CircleAlert, Link2, MoreHorizontal, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn, formatRelativeTime } from '@/lib/utils'
import { copyToClipboardWithFeedback } from '@/lib/clipboard'
import { extractSessionStatus } from '../../adapters/session'
import { getExploreSessionTitle } from '../utils'
import type { ExploreSession } from '../types'

interface SessionCardProps {
  canvasId: string
  session: ExploreSession
  selected: boolean
  disabled?: boolean
  onSelect: () => void
  onDelete: () => void
}

export function SessionCard({
  canvasId,
  session,
  selected,
  disabled,
  onSelect,
  onDelete,
}: SessionCardProps) {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  // State, not a ref: the confirm dialog reads it to return focus on close.
  const [menuTrigger, setMenuTrigger] = useState<HTMLButtonElement | null>(null)
  const name = getExploreSessionTitle(
    session,
    t('agent.explore.untitledChatNamed', { id: session.id.slice(-6) }),
  )
  const hasError = extractSessionStatus(session) === 'error'
  const updated = session.update_time
    ? formatRelativeTime(session.update_time)
    : ''
  return (
    <div
      className={cn(
        'group flex items-center rounded-radius-md transition-colors motion-reduce:transition-none',
        selected ? 'bg-accent-soft text-accent-fg' : 'text-fg hover:bg-sunken',
      )}
    >
      <button
        type="button"
        aria-pressed={selected}
        title={name}
        className="flex min-w-0 flex-1 items-center gap-space-sm rounded-radius-md px-space-sm py-space-sm text-left outline-hidden focus-visible:ring-2 focus-visible:ring-line-focus focus-visible:ring-inset"
        onClick={onSelect}
      >
        <span className="truncate text-sm">{name}</span>
        {hasError ? (
          <CircleAlert
            className="size-icon-sm shrink-0 text-danger-fg"
            aria-label={t('agent.explore.sessionError')}
          />
        ) : null}
      </button>
      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={setMenuTrigger}
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            className={cn(
              'mr-space-xs shrink-0 text-fg-subtle transition-opacity focus-visible:opacity-100 motion-reduce:transition-none md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100',
              (selected || menuOpen) && 'md:opacity-100',
            )}
            aria-label={t('agent.explore.chatActionsNamed', { name })}
          >
            <MoreHorizontal className="size-icon-sm" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          collisionPadding={8}
          align="start"
          side="right"
          aria-label={t('agent.explore.chatActionsNamed', { name })}
          className="w-56 border-line bg-surface p-space-xs motion-reduce:animate-none"
        >
          <p className="px-space-sm py-space-sm text-xs text-fg-muted">
            {updated}
            <span className="block">
              {t('agent.explore.messageCount', {
                count: session.message_count ?? session.messages?.length ?? 0,
              })}
            </span>
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => {
              const url = new URL(
                `/agent/${encodeURIComponent(canvasId)}/explore`,
                window.location.href,
              )
              url.searchParams.set('sessionId', session.id)
              void copyToClipboardWithFeedback(
                url.href,
                t('agent.explore.linkCopied'),
                t('agent.explore.copyFailed'),
              )
              setMenuOpen(false)
            }}
          >
            <Link2 className="size-icon-sm" />
            {t('agent.explore.copyLink')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-danger-fg"
            onClick={() => {
              setMenuOpen(false)
              setConfirmOpen(true)
            }}
          >
            <Trash2 className="size-icon-sm" />
            {t('agent.explore.deleteChat')}
          </Button>
        </PopoverContent>
      </Popover>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('agent.explore.deleteChatNamed', { name })}
        description={t('agent.explore.deleteChatDescription')}
        confirmLabel={t('agent.explore.deleteChat')}
        variant="destructive"
        icon={<Trash2 />}
        pending={disabled}
        returnFocus={menuTrigger}
        onConfirm={() => {
          // The rail owns the request and its feedback; the card only asks.
          setConfirmOpen(false)
          onDelete()
        }}
      />
    </div>
  )
}
