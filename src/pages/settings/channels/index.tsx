import { useMemo, useState } from 'react'
import { MessageCircleMore, Plus, TriangleAlert } from 'lucide-react'
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
import { ChannelCard } from './components/channel-card'
import { ChannelFormSheet } from './components/channel-form-sheet'

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

  const providers = useMemo(
    () => providersQuery.data?.items ?? [],
    [providersQuery.data],
  )
  // Provider metadata is what the create/edit form is built from, so losing it
  // disables authoring — but it must not hide channels that are already there.
  // Blanking the whole page also took away the one control that matters during
  // an incident: disabling a channel that is misbehaving.
  const providersUnavailable = providersQuery.isError || providers.length === 0

  const openCreate = () => {
    setSelectedChannel(null)
    setSheetOpen(true)
  }

  const openEdit = (channel: ChatChannel) => {
    setSelectedChannel(channel)
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

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="gap-space-md px-space-lg py-space-base flex shrink-0 items-center justify-between border-b border-border-subtle">
        <p className="max-w-3xl text-sm text-text-secondary">
          {t('channel.overview')}
        </p>
        <Button onClick={openCreate} disabled={providersUnavailable}>
          <Plus className="size-icon-sm" aria-hidden="true" />
          {t('channel.actions.create')}
        </Button>
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

      <div className="scroll-area p-space-lg min-h-0 flex-1 overflow-y-auto">
        {channels.length === 0 ? (
          <PageEmptyState
            title={t('channel.states.empty')}
            description={t('channel.states.emptyDescription')}
            icon={
              <MessageCircleMore className="size-icon-lg" aria-hidden="true" />
            }
            action={
              <Button onClick={openCreate} disabled={providersUnavailable}>
                <Plus className="size-icon-sm" aria-hidden="true" />
                {t('channel.actions.create')}
              </Button>
            }
          />
        ) : (
          <div className="gap-space-base grid grid-cols-1 xl:grid-cols-2">
            {channels.map((channel) => (
              <ChannelCard
                key={channel.id}
                channel={channel}
                busy={busy}
                onEdit={openEdit}
                onToggle={handleToggle}
                onDelete={setPendingDelete}
              />
            ))}
          </div>
        )}
      </div>

      {sheetOpen ? (
        <ChannelFormSheet
          open
          onOpenChange={setSheetOpen}
          providers={providers}
          channel={selectedChannel}
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
