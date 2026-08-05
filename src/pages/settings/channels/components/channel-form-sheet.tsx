import { useEffect, useMemo, useRef } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, RadioTower } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useForm, type Resolver } from 'react-hook-form'
import { toast } from 'sonner'
import type { ChannelProviderManifest, ChatChannel } from '@/api/channel'
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
  FEISHU_FALLBACK_MANIFEST,
  getChannelFormDefaults,
  getProviderFields,
  type ChannelFormValues,
} from '../form-model'
import { BindingFields } from './binding-fields'
import { ProviderFields } from './provider-fields'

interface ChannelFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  providers: ChannelProviderManifest[]
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
  const provider = currentChannel?.channel ?? providers[0]?.provider ?? 'feishu'
  const manifest =
    providers.find((item) => item.provider === provider) ??
    FEISHU_FALLBACK_MANIFEST
  const secretConfigured = currentChannel?.secret.configured ?? false
  const schema = useMemo(
    () =>
      createChannelFormSchema(
        manifest,
        secretConfigured,
        t('channel.validation.required'),
      ),
    [manifest, secretConfigured, t],
  )
  const form = useForm<ChannelFormValues>({
    resolver: zodResolver(schema) as Resolver<ChannelFormValues>,
    defaultValues: getChannelFormDefaults(manifest, currentChannel),
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
    form.reset(getChannelFormDefaults(manifest, currentChannelRef.current))
  }, [currentChannelId, form, manifest, open, isDirty])

  const selectedProvider = form.watch('provider')
  const selectedManifest =
    providers.find((item) => item.provider === selectedProvider) ?? manifest

  const handleProviderChange = (nextProvider: string) => {
    const nextManifest =
      providers.find((item) => item.provider === nextProvider) ?? manifest
    const defaults = getChannelFormDefaults(nextManifest)
    form.setValue('provider', nextProvider, { shouldValidate: true })
    form.setValue('config', defaults.config)
    form.setValue('secrets', defaults.secrets)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(getChannelFormDefaults(manifest, currentChannel))
    }
    onOpenChange(nextOpen)
  }

  const handleSubmit = form.handleSubmit(async (values) => {
    const fields = getProviderFields(selectedManifest)

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
        config: values.config,
        secrets: values.secrets,
        listFields: new Set(
          fields
            .filter((field) => field.kind === 'string_list')
            .map((field) => field.key),
        ),
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
                <div className="gap-space-sm rounded-radius-lg bg-surface-secondary p-space-base flex items-center border border-border-subtle text-sm">
                  <RadioTower
                    className="size-icon-md text-text-secondary"
                    aria-hidden="true"
                  />
                  <span className="text-text-secondary">
                    {t('channel.runtime.label')}:
                  </span>
                  <span className="font-medium text-text-primary">
                    {runtime?.state
                      ? t(`channel.runtime.states.${runtime.state}`, {
                          defaultValue: runtime.state,
                        })
                      : t('channel.runtime.unknown')}
                  </span>
                </div>
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
                  manifest={selectedManifest}
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
