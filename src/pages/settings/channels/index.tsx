import { useMemo, useState } from 'react'
import { MessageCircleMore, Plus, Search, TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { channelErrorMessageKey, type ChatChannel } from '@/api/channel'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
} from '@/components/patterns'
import {
  useDeleteChannel,
  useFetchChannelProviders,
  useFetchChannels,
  useSetChannelEnabled,
} from '@/hooks/use-channel-request'
import { countFaulted, filterChannels } from './utils'
import { ChannelGroups } from './components/channel-groups'
import { ChannelFormSheet } from './components/channel-form-sheet'
import { ProviderGallery } from './components/provider-gallery'

export const ChannelsPage = () => {
  const { t } = useTranslation()
  const channelsQuery = useFetchChannels()
  const providersQuery = useFetchChannelProviders()
  const toggleMutation = useSetChannelEnabled()
  const deleteMutation = useDeleteChannel()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState<ChatChannel | null>(
    null,
  )
  const [pendingDelete, setPendingDelete] = useState<ChatChannel | null>(null)
  const [creatingProvider, setCreatingProvider] = useState<string | undefined>()
  const [query, setQuery] = useState('')
  const [onlyFaulted, setOnlyFaulted] = useState(false)

  const providers = useMemo(
    () => providersQuery.data?.items ?? [],
    [providersQuery.data],
  )
  // Provider metadata is what the create/edit form is built from, so losing it
  // disables authoring — but it must not hide channels that are already there.
  // Blanking the whole page also took away the one control that matters during
  // an incident: disabling a channel that is misbehaving.
  const providersUnavailable = providersQuery.isError || providers.length === 0

  const openCreate = (provider?: string) => {
    setSelectedChannel(null)
    setCreatingProvider(provider)
    setSheetOpen(true)
  }

  const openEdit = (channel: ChatChannel) => {
    setSelectedChannel(channel)
    setCreatingProvider(undefined)
    setSheetOpen(true)
  }

  const handleToggle = async (channel: ChatChannel, enabled: boolean) => {
    try {
      await toggleMutation.mutateAsync({ id: channel.id, enabled })
      toast.success(
        enabled
          ? t('channel.messages.enabled')
          : t('channel.messages.disabled'),
      )
    } catch (error) {
      toast.error(
        t(channelErrorMessageKey(error, 'channel.messages.toggleFailed')),
      )
    }
  }

  const handleDelete = async () => {
    if (!pendingDelete) return
    try {
      await deleteMutation.mutateAsync(pendingDelete.id)
      toast.success(t('channel.messages.deleted'))
      setPendingDelete(null)
    } catch (error) {
      toast.error(
        t(channelErrorMessageKey(error, 'channel.messages.deleteFailed')),
      )
    }
  }

  const retry = () => {
    void channelsQuery.refetch()
    void providersQuery.refetch()
  }

  if (channelsQuery.isLoading || providersQuery.isLoading) {
    return (
      <PageLoadingState
        title={t('channel.states.loading')}
        description={t('channel.states.loadingDescription')}
      />
    )
  }

  // Only a channels-query failure is fatal to this page. A providers failure
  // is surfaced inline below, with the existing channels still listed.
  if (channelsQuery.isError) {
    return (
      <PageErrorState
        title={t('channel.states.error')}
        description={t('channel.states.errorDescription')}
        retryLabel={t('channel.actions.retry')}
        onRetry={retry}
      />
    )
  }

  const channels = channelsQuery.data?.items ?? []
  const busy = toggleMutation.isPending || deleteMutation.isPending
  // How many channels each provider already has. Shown on its gallery card
  // rather than hiding the card: connecting a second bot of the same provider
  // is a normal thing to want, and a disappearing tile reads as a bug.
  const connectedCounts = channels.reduce<Record<string, number>>(
    (counts, channel) => {
      counts[channel.channel] = (counts[channel.channel] ?? 0) + 1
      return counts
    },
    {},
  )

  // Localised names go into the filter so that typing a platform in the user's
  // own language finds it — the server only knows `feishu` and "Feishu / Lark".
  const providerLabels = Object.fromEntries(
    providers.map((manifest) => [
      manifest.provider,
      t(`channel.providers.${manifest.provider}.name`, {
        defaultValue: manifest.display_name,
      }),
    ]),
  )
  const faultCount = countFaulted(channels)
  const visibleChannels = filterChannels(channels, {
    query,
    onlyFaulted,
    providerLabels,
  })
  // One query, both sections. "Feishu" is one thing in the user's head, and
  // splitting it across two search boxes would make them pick which box means
  // what before they can type.
  const needle = query.trim().toLowerCase()
  const visibleProviders = providers.filter((manifest) =>
    [
      manifest.provider,
      manifest.display_name,
      providerLabels[manifest.provider] ?? '',
    ].some((field) => field.toLowerCase().includes(needle)),
  )
  const filtering = needle.length > 0 || onlyFaulted

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="gap-space-md px-space-lg py-space-base flex shrink-0 items-center justify-between border-b border-border-subtle">
        <p className="max-w-3xl text-sm text-text-secondary">
          {t('channel.overview')}
        </p>
        <div className="gap-space-sm flex shrink-0 items-center">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('channel.filter.placeholder')}
            aria-label={t('channel.filter.placeholder')}
            leftIcon={<Search className="size-icon-sm" aria-hidden="true" />}
            className="w-56"
          />
          <Button onClick={() => openCreate()} disabled={providersUnavailable}>
            <Plus className="size-icon-sm" aria-hidden="true" />
            {t('channel.actions.create')}
          </Button>
        </div>
      </div>

      {providersUnavailable ? (
        <output className="gap-space-sm px-space-lg py-space-sm flex w-full shrink-0 items-center border-b border-status-warning-subtle bg-status-warning-subtle text-sm text-status-warning">
          <TriangleAlert className="size-icon-sm shrink-0" aria-hidden="true" />
          <span>{t('channel.states.providersUnavailable')}</span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => void providersQuery.refetch()}
          >
            {t('channel.actions.retry')}
          </Button>
        </output>
      ) : null}

      <div className="scroll-area p-space-lg space-y-space-xl min-h-0 flex-1 overflow-y-auto">
        <section
          className="space-y-space-base"
          aria-labelledby="channel-connected-heading"
        >
          <div className="gap-space-sm flex items-center">
            <h3
              id="channel-connected-heading"
              className="font-semibold text-text-primary"
            >
              {t('channel.connected.title', { count: channels.length })}
            </h3>
            {filtering && channels.length > 0 ? (
              <span className="text-text-caption text-sm">
                {t('channel.filter.matched', {
                  count: visibleChannels.length,
                })}
              </span>
            ) : null}
            {/* Rendered only when there is something to filter to. A toggle
                that can only ever produce an empty list is a dead control. */}
            {faultCount > 0 ? (
              <Button
                size="sm"
                variant={onlyFaulted ? 'default' : 'outline'}
                className="ml-auto"
                aria-pressed={onlyFaulted}
                onClick={() => setOnlyFaulted((value) => !value)}
              >
                <TriangleAlert className="size-icon-sm" aria-hidden="true" />
                {t('channel.health.faultedCount', { count: faultCount })}
              </Button>
            ) : null}
          </div>
          {channels.length === 0 ? (
            <PageEmptyState
              title={t('channel.states.empty')}
              description={t('channel.states.emptyDescription')}
              icon={
                <MessageCircleMore
                  className="size-icon-lg"
                  aria-hidden="true"
                />
              }
            />
          ) : visibleChannels.length === 0 ? (
            <p className="py-space-lg text-center text-sm text-text-secondary">
              {t('channel.filter.noMatch')}
            </p>
          ) : (
            <ChannelGroups
              channels={visibleChannels}
              busy={busy}
              onEdit={openEdit}
              onToggle={handleToggle}
              onDelete={setPendingDelete}
              onAdd={openCreate}
            />
          )}
        </section>

        {/* The gallery is the answer to "what can I connect?", which the page
            previously only revealed once you had already started creating
            something. It stays visible with channels present, because adding a
            second one is the next thing anyone does. */}
        {providersUnavailable ? null : (
          <ProviderGallery
            providers={visibleProviders}
            connectedCounts={connectedCounts}
            disabled={busy}
            onSelect={openCreate}
          />
        )}
      </div>

      {sheetOpen ? (
        <ChannelFormSheet
          open
          onOpenChange={setSheetOpen}
          providers={providers}
          channel={selectedChannel}
          initialProvider={creatingProvider}
        />
      ) : null}

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('channel.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('channel.delete.description', {
                name: pendingDelete?.name ?? '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              {t('channel.actions.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => void handleDelete()}
            >
              {t('channel.actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
