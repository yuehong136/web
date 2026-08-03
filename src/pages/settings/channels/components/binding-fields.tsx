import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useFormContext } from 'react-hook-form'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useFetchAgentList, useFetchVersionList } from '@/hooks/use-agent-query'
import { useDialogApps } from '@/hooks/use-dialog-apps'
import { resolveLocalizedText } from '@/lib/agent'
import { AgentCanvasCategory } from '@/types/agent'
import {
  getLatestReleasedRevision,
  isPublishedAgent,
  resolveCanvasRevisionGuard,
  type ChannelFormValues,
} from '../form-model'

export const BindingFields = () => {
  const { t } = useTranslation()
  const form = useFormContext<ChannelFormValues>()
  const targetType = form.watch('targetType')
  const targetId = form.watch('targetId')
  const agentQuery = useFetchAgentList({
    page: 1,
    page_size: 100,
    canvas_category: AgentCanvasCategory.AGENT,
  })
  const dialogQuery = useDialogApps({
    enabled: targetType === 'multirag.dialog',
  })
  const versionQuery = useFetchVersionList(
    targetType === 'multirag.canvas_agent' ? targetId : undefined,
  )
  const releasedAgents = agentQuery.agents.filter(isPublishedAgent)
  const latestReleasedVersion = getLatestReleasedRevision(versionQuery.data)
  const targetLoading =
    targetType === 'multirag.canvas_agent'
      ? agentQuery.isLoading
      : dialogQuery.isLoading
  const targetError =
    targetType === 'multirag.canvas_agent'
      ? agentQuery.isError
      : dialogQuery.isError

  const handleTargetTypeChange = (value: ChannelFormValues['targetType']) => {
    form.setValue('targetType', value, { shouldValidate: true })
    form.setValue('targetId', '', { shouldValidate: true })
    form.setValue('targetRevisionId', '')
  }

  const handleTargetChange = (value: string) => {
    form.setValue('targetId', value, { shouldValidate: true })
    form.setValue('targetRevisionId', '')
  }

  useEffect(() => {
    if (targetType !== 'multirag.canvas_agent' || !targetId) {
      if (form.getValues('targetRevisionId')) {
        form.setValue('targetRevisionId', '', { shouldValidate: true })
      }
      return
    }
    if (versionQuery.isLoading) return

    const currentRevisionId = form.getValues('targetRevisionId')
    const revisionId = resolveCanvasRevisionGuard(
      currentRevisionId,
      latestReleasedVersion,
    )
    if (currentRevisionId !== revisionId) {
      form.setValue('targetRevisionId', revisionId, {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
  }, [
    form,
    latestReleasedVersion,
    targetId,
    targetType,
    versionQuery.isLoading,
  ])

  return (
    <div className="space-y-space-base">
      <FormField<ChannelFormValues, 'targetType'>
        name="targetType"
        render={({ field }) => (
          <FormItem>
            <FormLabel required>{t('channel.binding.targetType')}</FormLabel>
            <Select
              value={field.value}
              onValueChange={(value) =>
                handleTargetTypeChange(value as ChannelFormValues['targetType'])
              }
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue
                    placeholder={t('channel.binding.selectTargetType')}
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="multirag.canvas_agent">
                  {t('channel.binding.types.canvasAgent')}
                </SelectItem>
                <SelectItem value="multirag.dialog">
                  {t('channel.binding.types.dialog')}
                </SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField<ChannelFormValues, 'targetId'>
        name="targetId"
        render={({ field }) => (
          <FormItem>
            <FormLabel required>{t('channel.binding.targetId')}</FormLabel>
            <Select value={field.value} onValueChange={handleTargetChange}>
              <FormControl>
                <SelectTrigger disabled={targetLoading || targetError}>
                  <SelectValue
                    placeholder={
                      targetLoading
                        ? t('channel.binding.loadingTargets')
                        : t('channel.binding.selectTarget')
                    }
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {targetType === 'multirag.canvas_agent'
                  ? releasedAgents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {resolveLocalizedText(
                          agent.title,
                          t('channel.binding.unnamedTarget'),
                        )}
                      </SelectItem>
                    ))
                  : dialogQuery.data.map((dialog) => (
                      <SelectItem key={dialog.id} value={dialog.id}>
                        {dialog.name || t('channel.binding.unnamedTarget')}
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
            {targetLoading ? (
              <FormDescription className="gap-space-xs flex items-center">
                <Loader2
                  className="size-icon-sm animate-spin"
                  aria-hidden="true"
                />
                {t('channel.binding.loadingTargets')}
              </FormDescription>
            ) : targetError ? (
              <FormDescription className="text-status-error">
                {t('channel.binding.targetsLoadFailed')}
              </FormDescription>
            ) : (
              <FormDescription>
                {t('channel.binding.targetIdDescription')}
              </FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      {targetType === 'multirag.canvas_agent' ? (
        <FormField<ChannelFormValues, 'targetRevisionId'>
          name="targetRevisionId"
          render={({ field }) => {
            const hasStaleRevision = Boolean(
              field.value &&
              latestReleasedVersion &&
              field.value !== latestReleasedVersion.id,
            )
            return (
              <FormItem>
                <FormLabel required>
                  {t('channel.binding.revisionId')}
                </FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger
                      disabled={
                        !targetId ||
                        versionQuery.isLoading ||
                        !latestReleasedVersion
                      }
                    >
                      <SelectValue
                        placeholder={t('channel.binding.currentRelease')}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {hasStaleRevision ? (
                      <SelectItem value={field.value} disabled>
                        {t('channel.binding.staleRelease', {
                          revision: field.value,
                        })}
                      </SelectItem>
                    ) : null}
                    {latestReleasedVersion ? (
                      <SelectItem
                        key={latestReleasedVersion.id}
                        value={latestReleasedVersion.id}
                      >
                        {latestReleasedVersion.title ||
                          latestReleasedVersion.description ||
                          latestReleasedVersion.version_id ||
                          t('channel.binding.currentRelease')}
                      </SelectItem>
                    ) : null}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {versionQuery.isError
                    ? t('channel.binding.targetsLoadFailed')
                    : hasStaleRevision
                      ? t('channel.binding.staleReleaseDescription')
                      : t('channel.binding.revisionIdDescription')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )
          }}
        />
      ) : null}

      <FormField<ChannelFormValues, 'privateChatOnly'>
        name="privateChatOnly"
        render={({ field }) => (
          <FormItem className="rounded-radius-lg bg-surface-secondary p-space-base border border-border-subtle">
            <div className="gap-space-md flex items-center justify-between">
              <div className="space-y-space-xs">
                <FormLabel>{t('channel.policy.privateChatOnly')}</FormLabel>
                <FormDescription>
                  {t('channel.policy.privateChatOnlyDescription')}
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-label={t('channel.policy.privateChatOnly')}
                />
              </FormControl>
            </div>
          </FormItem>
        )}
      />
    </div>
  )
}
