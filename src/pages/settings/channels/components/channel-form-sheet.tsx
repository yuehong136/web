import { useEffect, useMemo, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useForm, type Resolver } from 'react-hook-form'
import { toast } from 'sonner'
import type { RenderableProviderManifest, ChatChannel } from '@/api/channel'
import {
  buildChannelMutationPayload,
  channelAPI,
  channelErrorMessageKey,
} from '@/api/channel'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  channelKeys,
  useFetchChannelDetail,
  useFetchChannelRuntime,
  useSaveChannel,
} from '@/hooks/use-channel-request'
import {
  createChannelFormSchema,
  getChannelFormDefaults,
  type ChannelFormValues,
} from '../form-model'
import { assembleConfig } from '../form-spec'
import { BindingFields } from './binding-fields'
import { ChannelRuntimeBanner } from './channel-runtime-banner'
import { ProviderFields } from './provider-fields'

interface ChannelFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  providers: RenderableProviderManifest[]
  channel: ChatChannel | null
}

export const ChannelFormSheet = ({
  open,
  onOpenChange,
  providers,
  channel,
}: ChannelFormSheetProps) => {
  const { t } = useTranslation()
  const detailQuery = useFetchChannelDetail(open ? (channel?.id ?? null) : null)
  const currentChannel = detailQuery.data ?? channel
  const provider = currentChannel?.channel ?? providers[0]?.provider ?? ''
  // `providers` is already filtered to renderable manifests by listProviders,
  // and the page disables authoring when it is empty, so there is nothing to
  // fall back to — a client-side manifest would only ever be a stale copy of
  // something the server owns.
  const manifest = providers.find((item) => item.provider === provider)
  const secretConfigured = currentChannel?.secret.configured ?? false

  // Everything below keys off `activeManifest`, never off `manifest`.
  //
  // The dead-form bug lived in exactly this gap: the schema was built from
  // `providers[0]` while the fields rendered came from the selected provider.
  // Choosing any other provider produced zod issues on fields that were not
  // mounted, so `handleSubmit` never reached its success branch and never
  // showed an error either — Save did nothing, silently, forever.
  const [pendingProvider, setPendingProvider] = useState<string | null>(null)
  const activeManifest =
    providers.find((item) => item.provider === (pendingProvider ?? provider)) ??
    manifest
  const fields = useMemo(
    () => activeManifest?.form.fields ?? [],
    [activeManifest],
  )

  const schema = useMemo(
    () =>
      createChannelFormSchema(
        fields,
        secretConfigured,
        t('channel.validation.required'),
      ),
    [fields, secretConfigured, t],
  )
  const form = useForm<ChannelFormValues>({
    resolver: zodResolver(schema) as Resolver<ChannelFormValues>,
    defaultValues: getChannelFormDefaults(
      fields,
      activeManifest?.provider ?? '',
      currentChannel,
    ),
  })
  const saveMutation = useSaveChannel()
  const queryClient = useQueryClient()
  const runtimeQuery = useFetchChannelRuntime(
    currentChannel?.id ?? null,
    open && Boolean(currentChannel),
  )

  // Reset on channel identity, not on object identity. Keying this effect on
  // `currentChannel` meant any background refetch produced a fresh object and
  // wiped the form — including a just-typed App Secret, which is the one field
  // the server never sends back, so nothing on screen revealed the loss.
  // The channel is read through a ref so the dependency list stays honest.
  const currentChannelRef = useRef(currentChannel)
  currentChannelRef.current = currentChannel
  const currentChannelId = currentChannel?.id ?? null
  const isDirty = form.formState.isDirty
  useEffect(() => {
    if (!open || isDirty) return
    form.reset(
      getChannelFormDefaults(
        fields,
        activeManifest?.provider ?? '',
        currentChannelRef.current,
      ),
    )
  }, [currentChannelId, form, fields, activeManifest?.provider, open, isDirty])

  const handleProviderChange = (nextProvider: string) => {
    const nextManifest = providers.find(
      (item) => item.provider === nextProvider,
    )
    const defaults = getChannelFormDefaults(
      nextManifest?.form.fields ?? [],
      nextProvider,
    )
    setPendingProvider(nextProvider)
    form.setValue('provider', nextProvider, { shouldValidate: true })
    form.setValue('config', defaults.config)
    form.setValue('secrets', defaults.secrets)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setPendingProvider(null)
      form.reset(
        getChannelFormDefaults(
          fields,
          activeManifest?.provider ?? '',
          currentChannel,
        ),
      )
    }
    onOpenChange(nextOpen)
  }

  const handleSubmit = form.handleSubmit(async (values) => {
    // PATCH resends `binding.enabled`, and the cached detail behind it can be
    // five minutes old — long enough for someone else to have disabled this
    // channel in the meantime, which a save of an unrelated field would then
    // silently undo. Refetching shrinks that window to one round-trip.
    //
    // Omitting the field instead is unsafe: `ChannelBindingUpsertRequest`
    // defaults `enabled` to false, so an older backend would read the omission
    // as "disable". A server-side concurrency token would be the complete fix
    // but forces a hard cross-repo deploy order for a sub-second race.
    let bindingEnabled = currentChannel?.binding?.enabled ?? false
    if (currentChannel) {
      try {
        const fresh = await queryClient.fetchQuery({
          queryKey: channelKeys.detail(currentChannel.id),
          queryFn: () => channelAPI.get(currentChannel.id),
        })
        bindingEnabled = fresh.binding?.enabled ?? false
      } catch {
        // Fall back to the cached value: a save that fails on a transient read
        // is worse than one that carries a slightly stale flag.
      }
    }

    const payload = buildChannelMutationPayload(
      {
        name: values.name,
        provider: values.provider,
        // The nested config is assembled from the server's field paths, so
        // nothing here knows what any provider's fields are called.
        config: assembleConfig(fields, values),
        targetType: values.targetType,
        targetId: values.targetId,
        targetRevisionId: values.targetRevisionId,
        privateChatOnly: values.privateChatOnly,
        bindingEnabled,
      },
      currentChannel ? 'update' : 'create',
    )

    try {
      await saveMutation.mutateAsync({ id: currentChannel?.id, payload })
      toast.success(t('channel.messages.saved'))
      handleOpenChange(false)
    } catch (error) {
      toast.error(
        t(channelErrorMessageKey(error, 'channel.messages.saveFailed')),
      )
    }
  })

  const isLoading = Boolean(channel) && detailQuery.isLoading
  const runtime = runtimeQuery.data ?? currentChannel?.runtime

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl">
        <SheetHeader className="p-space-lg pr-space-2xl border-b border-border-subtle">
          <SheetTitle>
            {currentChannel
              ? t('channel.form.editTitle')
              : t('channel.form.createTitle')}
          </SheetTitle>
          <SheetDescription>{t('channel.form.description')}</SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div
            className="flex flex-1 items-center justify-center"
            aria-busy="true"
          >
            <Loader2 className="size-icon-lg animate-spin text-text-secondary" />
            <span className="sr-only">{t('channel.states.loading')}</span>
          </div>
        ) : (
          <Form {...form}>
            <form
              id="channel-form"
              className="scroll-area space-y-space-lg p-space-lg flex-1 overflow-y-auto"
              onSubmit={handleSubmit}
              noValidate
            >
              {currentChannel ? (
                <ChannelRuntimeBanner runtime={runtime} />
              ) : null}

              <section
                className="space-y-space-base"
                aria-labelledby="channel-basic-heading"
              >
                <h3
                  id="channel-basic-heading"
                  className="font-semibold text-text-primary"
                >
                  {t('channel.form.basicSection')}
                </h3>
                <FormField<ChannelFormValues, 'name'>
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>
                        {t('channel.fields.name.label')}
                      </FormLabel>
                      <FormControl>
                        <Input {...field} autoComplete="off" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField<ChannelFormValues, 'provider'>
                  name="provider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>
                        {t('channel.fields.provider.label')}
                      </FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={handleProviderChange}
                        disabled={Boolean(currentChannel)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {providers.map((item) => (
                            <SelectItem
                              key={item.provider}
                              value={item.provider}
                            >
                              {item.display_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>

              <section
                className="space-y-space-base"
                aria-labelledby="channel-provider-heading"
              >
                <h3
                  id="channel-provider-heading"
                  className="font-semibold text-text-primary"
                >
                  {t('channel.form.connectionSection')}
                </h3>
                <ProviderFields
                  fields={fields}
                  secretConfigured={secretConfigured}
                />
              </section>

              <section
                className="space-y-space-base"
                aria-labelledby="channel-binding-heading"
              >
                <h3
                  id="channel-binding-heading"
                  className="font-semibold text-text-primary"
                >
                  {t('channel.form.bindingSection')}
                </h3>
                <BindingFields />
              </section>
            </form>
          </Form>
        )}

        <SheetFooter className="p-space-lg border-t border-border-subtle">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            {t('channel.actions.cancel')}
          </Button>
          <Button
            type="submit"
            form="channel-form"
            disabled={isLoading || saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <Loader2
                className="size-icon-sm animate-spin"
                aria-hidden="true"
              />
            ) : null}
            {t('channel.actions.saveDraft')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
