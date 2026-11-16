import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import type { ModelDefault, TenantModel } from '@/api/llm-provider-types'
import {
  ModelCapabilities,
  modelCapabilityKind,
  type ModelCapabilityKind,
} from '@/components/models/model-capabilities'
import { PageErrorState } from '@/components/patterns/page-states'
import { ProviderLogo } from '@/components/patterns/provider-logo'
import { Button } from '@/components/ui/button'
import {
  useModelDefaults,
  useModelProviders,
  useProviderInstances,
  useTenantModels,
} from '@/hooks/use-model-provider-request'
import { cn } from '@/lib/utils'
import { getCurrentLanguage } from '@/locales/i18n'

const CAPABILITY_ORDER = [
  'chat',
  'embedding',
  'image2text',
  'rerank',
  'speech2text',
  'tts',
  'ocr',
] as const

function ProviderCard({
  name,
  providerTypes,
  models,
  defaults,
  onManage,
}: {
  name: string
  providerTypes: readonly string[]
  /** This provider's configured models; undefined while they load. */
  models: TenantModel[] | undefined
  defaults: ModelDefault[]
  onManage: () => void
}) {
  const { t } = useTranslation()
  const instances = useProviderInstances(name)
  const list = instances.data ?? []
  if (instances.isSuccess && list.length === 0) return null
  const active = list.filter((instance) => instance.status === 'active').length
  const withKey = list.some((instance) => instance.has_api_key)
  const types = models?.length
    ? [...new Set(models.flatMap((model) => model.model_types))]
    : providerTypes
  const capabilities = CAPABILITY_ORDER.filter((kind) => types.includes(kind))
  const tools = models?.some((model) => model.is_tools) ?? false
  // The backend cannot check provider latency, so show what it does know:
  // how many connections are on, how many models, and whether a key is saved.
  const facts = [
    instances.isSuccess
      ? t('settings.models.connections', { count: list.length })
      : null,
    models ? t('settings.models.modelCount', { count: models.length }) : null,
  ].filter(Boolean)
  const defaultFor = [
    ...new Set(
      defaults
        .filter((item) => item.model_provider === name && item.reference)
        .map((item) => modelCapabilityKind(item.model_type))
        .filter((kind): kind is ModelCapabilityKind => kind !== null),
    ),
  ].map((kind) => t(`common.modelPicker.capabilities.${kind}`))
  return (
    <li className="min-w-0">
      <article
        aria-label={name}
        data-slot="provider-card"
        className="flex h-full flex-col gap-space-sm rounded-radius-xl border border-border-subtle bg-components-card-bg p-space-md transition-[border-color,box-shadow,transform] duration-150 hover:border-border-strong hover:shadow-elevation-medium motion-safe:hover:-translate-y-px"
      >
        <div className="flex min-w-0 items-center gap-space-sm">
          <ProviderLogo provider={name} size="lg" />
          <div className="flex min-w-0 flex-1 flex-col">
            <h3 className="truncate text-sm font-semibold text-text-primary">
              {name}
            </h3>
            {facts.length ? (
              <p className="truncate text-xs text-text-tertiary tabular-nums">
                {facts.join(' · ')}
              </p>
            ) : null}
          </div>
          {instances.isSuccess ? (
            <span
              className={cn(
                'inline-flex shrink-0 items-center gap-space-xs text-xs',
                active ? 'text-status-success' : 'text-text-tertiary',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'size-1.5 rounded-radius-full',
                  active ? 'bg-status-success' : 'bg-text-tertiary',
                )}
              />
              {t(
                active
                  ? 'settings.models.providerActive'
                  : 'settings.models.providerInactive',
              )}
            </span>
          ) : null}
        </div>
        {capabilities.length || tools ? (
          <ModelCapabilities types={capabilities} tools={tools} />
        ) : null}
        <div className="mt-auto flex min-w-0 items-center gap-space-sm border-t border-border-subtle pt-space-sm">
          <p className="min-w-0 flex-1 truncate text-xs text-text-tertiary">
            {defaultFor.length
              ? t('settings.models.defaultFor', {
                  list: new Intl.ListFormat(getCurrentLanguage(), {
                    type: 'conjunction',
                  }).format(defaultFor),
                })
              : instances.isSuccess
                ? t(
                    withKey
                      ? 'settings.models.instances.keySaved'
                      : 'settings.models.instances.noKey',
                  )
                : null}
          </p>
          <Button
            variant="outline"
            size="sm"
            aria-label={t('settings.models.manageNamed', { name })}
            onClick={onManage}
          >
            {t('settings.models.manage')}
          </Button>
        </div>
      </article>
    </li>
  )
}

/** Connected providers as cards under the default models, as on the board. */
export function ConnectedProviders({
  onManage,
}: {
  /** Opens the Providers tab at this provider, where connections are edited. */
  onManage: (provider: string) => void
}) {
  const { t } = useTranslation()
  const headingId = useId()
  const providers = useModelProviders()
  const models = useTenantModels()
  const defaults = useModelDefaults()
  const connected = providers.data ?? []
  const modelsByProvider = new Map<string, TenantModel[]>()
  for (const model of models.data ?? [])
    modelsByProvider.set(model.provider_name, [
      ...(modelsByProvider.get(model.provider_name) ?? []),
      model,
    ])
  return (
    <section
      aria-labelledby={headingId}
      data-slot="connected-providers"
      className="mt-space-xl flex flex-col gap-space-sm"
    >
      <div className="flex flex-wrap items-baseline gap-x-space-sm gap-y-space-2xs">
        <h2 id={headingId} className="text-sm font-semibold text-text-primary">
          {t('settings.models.connected')}
        </h2>
        {providers.isSuccess && connected.length ? (
          <span className="text-xs text-text-tertiary tabular-nums">
            {[
              t('settings.models.providerCount', { count: connected.length }),
              models.isSuccess
                ? t('settings.models.modelCount', { count: models.data.length })
                : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
        ) : null}
      </div>
      {providers.isError ? (
        <PageErrorState
          compact
          titleAs="h3"
          title={t('settings.models.defaultsModelsFailed')}
          description={null}
          retryLabel={t('common.retry')}
          onRetry={() => void providers.refetch()}
        />
      ) : providers.isSuccess && connected.length === 0 ? (
        <p className="rounded-radius-xl border border-dashed border-border-default px-space-md py-space-lg text-center text-sm text-text-secondary">
          {t('settings.models.noneConnected')}
        </p>
      ) : (
        <ul
          aria-labelledby={headingId}
          className="grid grid-cols-[repeat(auto-fill,minmax(min(18.75rem,100%),1fr))] gap-space-sm"
        >
          {connected.map((provider) => (
            <ProviderCard
              key={provider.name}
              name={provider.name}
              providerTypes={provider.model_types}
              models={
                models.isSuccess
                  ? (modelsByProvider.get(provider.name) ?? [])
                  : undefined
              }
              defaults={defaults.data ?? []}
              onManage={() => onManage(provider.name)}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
