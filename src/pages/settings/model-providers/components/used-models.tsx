import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useModelProviders,
  useProviderInstances,
  useModelProviderMutation,
} from '@/hooks/use-model-provider-request'
import { modelProvidersAPI } from '@/api/llm-providers'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  PageErrorState,
  PageLoadingState,
  PageEmptyState,
} from '@/components/patterns'
import { ProviderInstance } from './provider-instance'
import { ProviderIcon } from '@/components/ui/provider-icon'
import { SettingRow, SettingSection } from '@/components/patterns/setting-row'
import { ModelMutationError } from './model-mutation-error'

export function UsedModels({
  handleAddModel,
}: {
  handleAddModel: (provider: string) => void
}) {
  const { t } = useTranslation()
  const providers = useModelProviders()
  if (providers.isPending)
    return (
      <PageLoadingState
        title={t('common.loading')}
        description={null}
        compact
      />
    )
  if (providers.isError)
    return (
      <PageErrorState
        title={t('settings.models.defaultsModelsFailed')}
        description={null}
        onRetry={() => void providers.refetch()}
        compact
      />
    )
  return (
    <SettingSection
      title={t('settings.models.configured')}
      description={t('settings.models.configuredHint')}
    >
      {providers.data.length ? (
        providers.data.map((provider) => (
          <ConfiguredProvider
            key={provider.name}
            name={provider.name}
            add={() => handleAddModel(provider.name)}
          />
        ))
      ) : (
        <PageEmptyState
          title={t('settings.models.chooseProvider')}
          description={null}
          compact
        />
      )}
    </SettingSection>
  )
}
function ConfiguredProvider({ name, add }: { name: string; add: () => void }) {
  const { t } = useTranslation(),
    instances = useProviderInstances(name),
    mutation = useModelProviderMutation()
  const [removing, setRemoving] = useState(false),
    [failure, setFailure] = useState<unknown>(null)
  if (instances.isSuccess && instances.data.length === 0) return null
  return (
    <article aria-label={name} className="flex flex-col">
      <SettingRow
        leading={<ProviderIcon provider={name} className="size-6" size={24} />}
        label={name}
        description={
          instances.isSuccess
            ? t('settings.models.connections', {
                count: instances.data.length,
              })
            : undefined
        }
      >
        <Button variant="outline" size="sm" onClick={add}>
          {t('settings.models.instances.add')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setFailure(null)
            setRemoving(true)
          }}
        >
          {t('common.delete')}
        </Button>
      </SettingRow>
      <div className="flex flex-col pb-space-sm pl-space-xl">
        {instances.isPending ? (
          <PageLoadingState
            title={t('common.loading')}
            description={null}
            compact
          />
        ) : instances.isError ? (
          <PageErrorState
            title={t('settings.models.defaultsModelsFailed')}
            description={null}
            onRetry={() => void instances.refetch()}
            compact
          />
        ) : (
          instances.data.map((instance) => (
            <ProviderInstance key={instance.id} instance={instance} />
          ))
        )}
      </div>
      {!removing && failure !== null && <ModelMutationError error={failure} />}
      <ConfirmDialog
        variant="destructive"
        open={removing}
        onOpenChange={(open) => !mutation.isPending && setRemoving(open)}
        title={t('common.delete')}
        description={
          <div className="space-y-space-sm">
            <span className="block">
              {t('settings.models.instances.deleteConfirm', { name })}
            </span>
            {failure !== null && <ModelMutationError error={failure} />}
          </div>
        }
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        pending={mutation.isPending}
        onConfirm={() => {
          setFailure(null)
          mutation.mutate(() => modelProvidersAPI.deleteProvider(name), {
            onSuccess: () => setRemoving(false),
            onError: (error) => setFailure(error),
          })
        }}
      />
    </article>
  )
}
