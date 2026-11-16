import { useEffect, useId, useRef, useState } from 'react'
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
import { ProviderLogo } from '@/components/patterns/provider-logo'
import { SettingRow } from '@/components/patterns/setting-row'
import { ModelMutationError } from './model-mutation-error'

export function UsedModels({
  handleAddModel,
  revealProvider,
}: {
  handleAddModel: (provider: string) => void
  /** Scrolls to and focuses this provider's card once it renders. */
  revealProvider?: string | null
}) {
  const { t } = useTranslation()
  const headingId = useId()
  const providers = useModelProviders()
  const ready = providers.isSuccess
  const revealed = useRef<string | null>(null)
  useEffect(() => {
    if (!ready || !revealProvider || revealed.current === revealProvider) return
    const card = document.getElementById(providerCardId(revealProvider))
    if (!card) return
    revealed.current = revealProvider
    card.scrollIntoView({ block: 'start' })
    card.focus({ preventScroll: true })
  }, [ready, revealProvider])
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
    <section
      aria-labelledby={headingId}
      data-slot="configured-providers"
      className="flex flex-col gap-space-sm"
    >
      <div>
        <h2 id={headingId} className="text-sm font-semibold text-text-primary">
          {t('settings.models.configured')}
        </h2>
        <p className="text-xs text-text-secondary">
          {t('settings.models.configuredHint')}
        </p>
      </div>
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

/** Anchor of a provider's card, so "Manage" on the Defaults tab can open it. */
export const providerCardId = (name: string) =>
  `provider-${name.replace(/[^\w-]+/g, '-')}`

function ConfiguredProvider({ name, add }: { name: string; add: () => void }) {
  const { t } = useTranslation(),
    instances = useProviderInstances(name),
    mutation = useModelProviderMutation()
  const [removing, setRemoving] = useState(false),
    [failure, setFailure] = useState<unknown>(null)
  if (instances.isSuccess && instances.data.length === 0) return null
  return (
    <article
      id={providerCardId(name)}
      tabIndex={-1}
      aria-label={name}
      data-slot="configured-provider"
      className="flex scroll-mt-space-md flex-col rounded-radius-xl border border-border-subtle bg-components-card-bg px-space-md pb-space-xs outline-hidden focus-visible:ring-2 focus-visible:ring-state-focus"
    >
      <SettingRow
        className="border-t-0"
        leading={<ProviderLogo provider={name} size="lg" />}
        label={<span className="font-semibold">{name}</span>}
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
      <div className="flex flex-col border-t border-border-subtle sm:pl-space-2xl">
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
