import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ChatChannel } from '@/api/channel'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { channelHealth } from './channel-status'
import { ChannelRow } from './channel-row'
import { ProviderLogo } from './provider-logo'

interface ChannelGroupsProps {
  channels: ChatChannel[]
  busy: boolean
  onEdit: (channel: ChatChannel) => void
  onToggle: (channel: ChatChannel, enabled: boolean) => void
  onDelete: (channel: ChatChannel) => void
  onAdd: (provider: string) => void
}

/**
 * Connected channels, grouped by the platform they belong to.
 *
 * Grouping is what makes ten Feishu bots legible, and it is also where the
 * provider logo finally means something. It used to sit on every card as a
 * generic robot glyph — the wrong artwork in the wrong place, repeated once
 * per channel. Here it appears once, on the thing it identifies.
 *
 * Groups come from the channels themselves rather than from the provider
 * manifest, so a channel whose provider was later unregistered still shows up
 * under its own heading instead of vanishing from a page whose entire job is
 * to let you disable and delete it.
 */
export const ChannelGroups = ({
  channels,
  busy,
  onEdit,
  onToggle,
  onDelete,
  onAdd,
}: ChannelGroupsProps) => {
  const { t } = useTranslation()

  const groups = new Map<string, ChatChannel[]>()
  for (const channel of channels) {
    const existing = groups.get(channel.channel)
    if (existing) existing.push(channel)
    else groups.set(channel.channel, [channel])
  }

  return (
    <div className="space-y-space-base">
      {[...groups.entries()].map(([provider, rows]) => {
        const faulted = rows.filter(
          (row) => channelHealth(row) === 'faulted',
        ).length

        return (
          <Card key={provider} padding="none" className="overflow-hidden">
            <div className="gap-space-sm px-space-base py-space-sm bg-surface-secondary flex items-center border-b border-border-subtle">
              <ProviderLogo
                provider={provider}
                displayName={provider}
                className="size-icon-md shrink-0"
              />
              <span className="font-medium text-text-primary">
                {t(`channel.providers.${provider}.name`, {
                  defaultValue: provider,
                })}
              </span>
              <span className="text-text-caption text-sm">{rows.length}</span>
              {/* Surfaced on the header so a fault is visible without reading
                  every row — the reason to look at this page at all. */}
              {faulted > 0 ? (
                <span className="rounded-radius-sm bg-status-error-subtle px-1.5 py-0.5 text-xs text-status-error">
                  {t('channel.health.faultedCount', { count: faulted })}
                </span>
              ) : null}
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto"
                disabled={busy}
                onClick={() => onAdd(provider)}
              >
                <Plus className="size-icon-sm" aria-hidden="true" />
                {t('channel.gallery.connect')}
              </Button>
            </div>

            <ul>
              {rows.map((channel) => (
                <ChannelRow
                  key={channel.id}
                  channel={channel}
                  busy={busy}
                  onEdit={onEdit}
                  onToggle={onToggle}
                  onDelete={onDelete}
                />
              ))}
            </ul>
          </Card>
        )
      })}
    </div>
  )
}
