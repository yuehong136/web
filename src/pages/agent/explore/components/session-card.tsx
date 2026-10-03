import { useTranslation } from 'react-i18next'
import { CircleAlert, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, formatRelativeTime } from '@/lib/utils'
import { extractSessionStatus } from '../../adapters/session'
import type { ExploreSession } from '../types'

interface SessionCardProps {
  session: ExploreSession
  selected: boolean
  disabled?: boolean
  onSelect: () => void
  onDelete: () => void
}

export function SessionCard({
  session,
  selected,
  disabled,
  onSelect,
  onDelete,
}: SessionCardProps) {
  const { t } = useTranslation()
  const name = session.isTemporary
    ? t('agent.explore.newChat')
    : session.name || t('agent.explore.unnamedChat')
  const messageCount = session.message_count ?? session.messages?.length ?? 0
  const hasError = extractSessionStatus(session) === 'error'

  return (
    <div
      className={cn(
        'group relative flex items-start rounded-radius-lg transition-colors',
        selected ? 'bg-state-focus-10' : 'hover:bg-background-subtle',
      )}
    >
      <button
        type="button"
        aria-pressed={selected}
        className="flex min-w-0 flex-1 flex-col gap-space-xs rounded-radius-lg py-space-base pr-space-2xl pl-space-base text-left outline-hidden focus-visible:ring-2 focus-visible:ring-state-focus focus-visible:ring-inset"
        onClick={onSelect}
      >
        <span className="block w-full truncate text-sm font-medium text-text-primary">
          {name}
        </span>
        <span className="flex w-full flex-wrap items-center gap-x-space-sm gap-y-space-xs text-xs text-text-tertiary">
          {session.isTemporary ? (
            <span>{t('agent.explore.temporaryChatHint')}</span>
          ) : (
            <>
              {session.update_time ? (
                <span>{formatRelativeTime(session.update_time)}</span>
              ) : null}
              <span>
                {t('agent.explore.messageCount', { count: messageCount })}
              </span>
            </>
          )}
          {hasError ? (
            <span className="flex items-center gap-space-xs text-status-error">
              <CircleAlert className="size-icon-sm" aria-hidden="true" />
              {t('agent.explore.sessionError')}
            </span>
          ) : null}
        </span>
      </button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={disabled}
        className="absolute top-space-sm right-space-xs text-text-tertiary opacity-100 transition-opacity hover:text-status-error focus-visible:opacity-100 md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100"
        onClick={onDelete}
        title={t('agent.explore.deleteChatNamed', { name })}
        aria-label={t('agent.explore.deleteChatNamed', { name })}
      >
        <Trash2 className="size-icon-sm" aria-hidden="true" />
      </Button>
    </div>
  )
}
