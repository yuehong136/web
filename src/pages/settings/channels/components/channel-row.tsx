import {
  MoreHorizontal,
  Pencil,
  Power,
  PowerOff,
  Trash2,
  TriangleAlert,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ChatChannel } from '@/api/channel'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDate } from '@/lib/utils'
import {
  formatHeartbeatAge,
  isBindingRevisionStale,
  isChannelEnabled,
} from '../utils'
import { channelHealth, HEALTH_DOT, HEALTH_TEXT } from './channel-status'

interface ChannelRowProps {
  channel: ChatChannel
  busy: boolean
  onEdit: (channel: ChatChannel) => void
  onToggle: (channel: ChatChannel, enabled: boolean) => void
  onDelete: (channel: ChatChannel) => void
}

/**
 * One connected channel, as a row rather than a card.
 *
 * The card this replaces spent a definition list on five labelled fields, so
 * ten Feishu bots — the case this page is heading for — produced a wall of
 * repeated labels with the differences buried inside it. Rows put the varying
 * parts in fixed columns, which is what makes a list of ten scannable: name,
 * what it is bound to, health, when it last reported.
 *
 * The provider is not repeated here. It identifies the group this row lives
 * in, and printing it ten times is the noise the grouping exists to remove.
 */
export const ChannelRow = ({
  channel,
  busy,
  onEdit,
  onToggle,
  onDelete,
}: ChannelRowProps) => {
  const { t, i18n } = useTranslation()
  const enabled = isChannelEnabled(channel.status)
  const health = channelHealth(channel)
  const targetType = channel.binding?.target_type
  const stale = isBindingRevisionStale(channel.binding)
  const errorCode = channel.runtime?.last_error_code

  return (
    <li className="gap-space-base px-space-base py-space-sm hover:bg-surface-secondary flex items-center border-t border-border-subtle transition-colors first:border-t-0">
      <span
        className={`size-2 shrink-0 rounded-full ${HEALTH_DOT[health]}`}
        aria-hidden="true"
      />

      <div className="min-w-0 flex-1">
        <div className="gap-space-sm flex items-center">
          <span className="truncate font-medium text-text-primary">
            {channel.name}
          </span>
          {/* Both warnings ride on the row instead of a full-width banner: at
              ten rows a banner per channel is taller than the list it explains. */}
          {stale ? (
            <span
              className="gap-space-xs rounded-radius-sm inline-flex shrink-0 items-center bg-status-warning-subtle px-1.5 py-0.5 text-xs text-status-warning"
              title={t('channel.binding.revisionStale')}
            >
              <TriangleAlert className="size-3" aria-hidden="true" />
              {t('channel.binding.staleShort')}
            </span>
          ) : null}
          {errorCode ? (
            <span
              className="rounded-radius-sm shrink-0 bg-status-error-subtle px-1.5 py-0.5 font-mono text-xs text-status-error"
              title={t('channel.runtime.errorCode', { code: errorCode })}
            >
              {errorCode}
            </span>
          ) : null}
        </div>
        <p className="text-text-caption truncate text-xs">
          {targetType ? (
            <>
              {t(
                `channel.binding.types.${targetType === 'multirag.dialog' ? 'dialog' : 'canvasAgent'}`,
              )}
              <span className="mx-1">·</span>
              <span className="font-mono">{channel.binding?.target_id}</span>
            </>
          ) : (
            t('channel.binding.notConfigured')
          )}
        </p>
      </div>

      <div className="gap-space-xs hidden shrink-0 items-center text-sm sm:flex">
        <span className={HEALTH_TEXT[health]}>
          {t(`channel.health.${health}`)}
        </span>
      </div>

      <span
        className="text-text-caption hidden w-28 shrink-0 text-right text-xs lg:block"
        title={
          channel.runtime?.heartbeat_at
            ? formatDate(channel.runtime.heartbeat_at)
            : undefined
        }
      >
        {formatHeartbeatAge(channel.runtime?.heartbeat_at, i18n.language)}
      </span>

      {/* Three always-visible buttons per row is thirty controls at ten rows,
          two of them destructive. A menu keeps the row scannable and puts a
          deliberate click in front of delete. */}
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            aria-label={t('channel.actions.more', { name: channel.name })}
          >
            <MoreHorizontal className="size-icon-sm" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="right">
          <DropdownMenuItem onClick={() => onEdit(channel)}>
            <Pencil className="size-icon-sm" aria-hidden="true" />
            {t('channel.actions.edit')}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!channel.binding || !channel.secret.configured}
            onClick={() => onToggle(channel, !enabled)}
          >
            {enabled ? (
              <PowerOff className="size-icon-sm" aria-hidden="true" />
            ) : (
              <Power className="size-icon-sm" aria-hidden="true" />
            )}
            {enabled
              ? t('channel.actions.disable')
              : t('channel.actions.enable')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-status-error"
            onClick={() => onDelete(channel)}
          >
            <Trash2 className="size-icon-sm" aria-hidden="true" />
            {t('channel.actions.delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  )
}
