import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { CircleAlert, Link2, MoreHorizontal, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  const menuRef = useRef<HTMLButtonElement>(null)
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
        selected ? 'bg-background-subtle' : 'hover:bg-background-subtle',
      )}
    >
      <button
        type="button"
        aria-pressed={selected}
        title={name}
        className="flex min-w-0 flex-1 items-center gap-space-sm rounded-radius-md px-space-sm py-space-sm text-left outline-hidden focus-visible:ring-2 focus-visible:ring-state-focus focus-visible:ring-inset"
        onClick={onSelect}
      >
        <span className="truncate text-sm text-text-primary">{name}</span>
        {hasError ? (
          <CircleAlert
            className="size-icon-sm shrink-0 text-status-error"
            aria-label={t('agent.explore.sessionError')}
          />
        ) : null}
      </button>
      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={menuRef}
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            className={cn(
              'mr-space-xs shrink-0 text-text-tertiary transition-opacity focus-visible:opacity-100 motion-reduce:transition-none md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100',
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
          className="w-56 border-border-default bg-components-console-surface p-space-xs motion-reduce:animate-none"
        >
          <p className="px-space-sm py-space-sm text-xs text-text-secondary">
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
            className="w-full justify-start text-status-error"
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
      <AlertDialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-components-dialog-overlay" />
          <AlertDialog.Content
            onCloseAutoFocus={(event) => {
              event.preventDefault()
              menuRef.current?.focus()
            }}
            className="fixed top-1/2 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-radius-xl border border-border-default bg-components-console-surface p-space-lg shadow-elevation-high"
          >
            <AlertDialog.Title className="text-lg font-semibold text-text-primary">
              {t('agent.explore.deleteChatNamed', { name })}
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-space-sm text-sm text-text-secondary">
              {t('agent.explore.deleteChatDescription')}
            </AlertDialog.Description>
            <div className="mt-space-lg flex justify-end gap-space-sm">
              <AlertDialog.Cancel asChild>
                <Button variant="outline" size="sm">
                  {t('common.cancel')}
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={disabled}
                  onClick={onDelete}
                >
                  {t('agent.explore.deleteChat')}
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  )
}
