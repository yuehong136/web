import {
  Bot,
  KeyRound,
  Pencil,
  Power,
  PowerOff,
  RadioTower,
  Trash2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ChatChannel } from '@/api/channel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import {
  isBindingRevisionStale,
  isChannelEnabled,
  isRuntimeHealthy,
} from '../utils'

interface ChannelCardProps {
  channel: ChatChannel
  busy: boolean
  onEdit: (channel: ChatChannel) => void
  onToggle: (channel: ChatChannel, enabled: boolean) => void
  onDelete: (channel: ChatChannel) => void
}

export const ChannelCard = ({
  channel,
  busy,
  onEdit,
  onToggle,
  onDelete,
}: ChannelCardProps) => {
  const { t } = useTranslation()
  const enabled = isChannelEnabled(channel.status)
  const runtimeHealthy = isRuntimeHealthy(channel.runtime?.state)
  const targetType = channel.binding?.target_type

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="space-y-space-base p-space-lg">
        <div className="gap-space-md flex items-start justify-between">
          <div className="gap-space-sm flex min-w-0 items-center">
            <div className="rounded-radius-lg bg-surface-secondary flex size-11 shrink-0 items-center justify-center text-text-secondary">
              <Bot className="size-icon-lg" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-text-primary">
                {channel.name}
              </h3>
              <p className="text-sm text-text-secondary">
                {t(`channel.providers.${channel.channel}`, {
                  defaultValue: channel.channel,
                })}
              </p>
            </div>
          </div>
          <Badge variant={enabled ? 'success' : 'secondary'}>
            {enabled ? t('channel.status.enabled') : t('channel.status.draft')}
          </Badge>
        </div>

        <dl className="space-y-space-sm text-sm">
          <div className="gap-space-sm flex items-center justify-between">
            <dt className="gap-space-xs flex items-center text-text-secondary">
              <RadioTower className="size-icon-sm" aria-hidden="true" />
              {t('channel.runtime.label')}
            </dt>
            <dd
              className={
                runtimeHealthy ? 'text-status-success' : 'text-text-primary'
              }
            >
              {channel.runtime?.state
                ? t(`channel.runtime.states.${channel.runtime.state}`, {
                    defaultValue: channel.runtime.state,
                  })
                : t('channel.runtime.unknown')}
            </dd>
          </div>
          <div className="gap-space-sm flex items-center justify-between">
            <dt className="gap-space-xs flex items-center text-text-secondary">
              <KeyRound className="size-icon-sm" aria-hidden="true" />
              {t('channel.secret.label')}
            </dt>
            <dd className="text-text-primary">
              {channel.secret.configured
                ? t('channel.secret.configured')
                : t('channel.secret.missing')}
            </dd>
          </div>
          <div className="gap-space-sm flex items-start justify-between">
            <dt className="text-text-secondary">
              {t('channel.binding.target')}
            </dt>
            <dd className="min-w-0 text-right text-text-primary">
              {targetType ? (
                <>
                  <div>
                    {t(
                      `channel.binding.types.${targetType === 'multirag.dialog' ? 'dialog' : 'canvasAgent'}`,
                    )}
                  </div>
                  <div className="text-text-caption max-w-64 truncate font-mono text-xs">
                    {channel.binding?.target_id}
                  </div>
                </>
              ) : (
                t('channel.binding.notConfigured')
              )}
            </dd>
          </div>
          {channel.runtime?.heartbeat_at ? (
            <div className="gap-space-sm flex items-center justify-between">
              <dt className="text-text-secondary">
                {t('channel.runtime.lastHeartbeat')}
              </dt>
              <dd className="text-text-primary">
                {formatDate(channel.runtime.heartbeat_at)}
              </dd>
            </div>
          ) : null}
        </dl>

        {isBindingRevisionStale(channel.binding) ? (
          <output className="rounded-radius-md p-space-sm border border-status-warning-subtle bg-status-warning-subtle text-xs text-status-warning">
            {t('channel.binding.revisionStale')}
          </output>
        ) : null}

        {channel.runtime?.last_error_code ? (
          <output className="rounded-radius-md p-space-sm border border-status-error-subtle bg-status-error-subtle text-xs text-status-error">
            {t('channel.runtime.errorCode', {
              code: channel.runtime.last_error_code,
            })}
          </output>
        ) : null}
      </div>

      <div className="gap-space-xs bg-surface-secondary p-space-sm flex items-center justify-end border-t border-border-subtle">
        <Button
          size="sm"
          variant="ghost"
          disabled={busy}
          onClick={() => onEdit(channel)}
        >
          <Pencil className="size-icon-sm" aria-hidden="true" />
          {t('channel.actions.edit')}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={busy || !channel.binding || !channel.secret.configured}
          onClick={() => onToggle(channel, !enabled)}
        >
          {enabled ? (
            <PowerOff className="size-icon-sm" aria-hidden="true" />
          ) : (
            <Power className="size-icon-sm" aria-hidden="true" />
          )}
          {enabled ? t('channel.actions.disable') : t('channel.actions.enable')}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={busy}
          className="text-status-error"
          onClick={() => onDelete(channel)}
        >
          <Trash2 className="size-icon-sm" aria-hidden="true" />
          {t('channel.actions.delete')}
        </Button>
      </div>
    </Card>
  )
}
