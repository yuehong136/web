import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useModelProviders,
  useProviderInstances,
  useModelProviderMutation,
} from '@/hooks/use-model-provider-request'
import { modelProvidersAPI } from '@/api/llm-providers'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import {
  PageErrorState,
  PageLoadingState,
  PageEmptyState,
} from '@/components/patterns'
import { ProviderInstance } from './provider-instance'

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
    <section className="flex flex-col gap-space-base">
      <h2 className="text-base font-semibold">
        {t('settings.models.configured')}
      </h2>
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
    </section>
  )
}
function ConfiguredProvider({ name, add }: { name: string; add: () => void }) {
  const { t } = useTranslation(),
    instances = useProviderInstances(name),
    mutation = useModelProviderMutation()
  const [removing, setRemoving] = useState(false),
    [failed, setFailed] = useState(false)
  return (
    <article className="flex flex-col gap-space-base rounded-radius-lg border border-border-default p-space-base">
      <header className="flex items-center justify-between gap-space-base">
        <h3 className="font-semibold">{name}</h3>
        <div className="flex gap-space-xs">
          <Button variant="outline" size="sm" onClick={add}>
            {t('settings.models.instances.add')}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setRemoving(true)}>
            {t('common.delete')}
          </Button>
        </div>
      </header>
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
      {failed && (
        <p role="alert" className="text-status-error">
          {t('settings.models.instances.failed')}
        </p>
      )}
      <ConfirmationDialog
        open={removing}
        onOpenChange={(open) => !mutation.isPending && setRemoving(open)}
        title={t('common.delete')}
        description={t('settings.models.instances.deleteConfirm', { name })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        pending={mutation.isPending}
        onConfirm={() => {
          setFailed(false)
          mutation.mutate(() => modelProvidersAPI.deleteProvider(name), {
            onSuccess: () => setRemoving(false),
            onError: () => setFailed(true),
          })
        }}
      />
    </article>
  )
}
