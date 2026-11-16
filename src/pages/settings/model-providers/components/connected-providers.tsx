import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { SettingRow, SettingSection } from '@/components/patterns/setting-row'
import { Button } from '@/components/ui/button'
import { ProviderIcon } from '@/components/ui/provider-icon'
import { useFetchFactories } from '@/hooks/use-llm-request'
import {
  useModelProviders,
  useProviderInstances,
} from '@/hooks/use-model-provider-request'

function ConnectedProviderRow({
  name,
  onManage,
}: {
  name: string
  onManage: () => void
}) {
  const { t } = useTranslation()
  const instances = useProviderInstances(name)
  const list = instances.data ?? []
  const active = list.filter((instance) => instance.status === 'active').length
  const withKey = list.some((instance) => instance.has_api_key)
  if (instances.isSuccess && list.length === 0) return null
  // The backend cannot check provider latency, so show what it does know:
  // how many connections are on and whether a credential is saved.
  const description = instances.isSuccess
    ? [
        t('settings.models.connections', { count: list.length }),
        t(
          withKey
            ? 'settings.models.instances.keySaved'
            : 'settings.models.instances.noKey',
        ),
      ].join(' · ')
    : undefined
  return (
    <SettingRow
      leading={<ProviderIcon provider={name} className="size-6" size={24} />}
      label={name}
      description={description}
    >
      {instances.isSuccess ? (
        <span className="inline-flex items-center gap-space-xs text-sm text-text-secondary">
          <span
            aria-hidden="true"
            className={
              active
                ? 'size-1.5 rounded-radius-full bg-status-success'
                : 'size-1.5 rounded-radius-full bg-text-tertiary'
            }
          />
          {t(
            active
              ? 'settings.models.providerActive'
              : 'settings.models.providerInactive',
          )}
        </span>
      ) : null}
      <Button variant="outline" size="sm" onClick={onManage}>
        {t('settings.models.manage')}
      </Button>
    </SettingRow>
  )
}

/** Summary of connected providers under the default models, as on the board. */
export function ConnectedProviders({
  onManage,
}: {
  /** Opens the Providers tab, where connections are edited. */
  onManage: () => void
}) {
  const { t } = useTranslation()
  const providers = useModelProviders()
  const { factories } = useFetchFactories()
  const connected = providers.data ?? []
  return (
    <SettingSection title={t('settings.models.connected')}>
      {connected.map((provider) => (
        <ConnectedProviderRow
          key={provider.name}
          name={provider.name}
          onManage={onManage}
        />
      ))}
      <SettingRow
        leading={
          <span className="flex size-6 items-center justify-center rounded-radius-sm border border-dashed border-border-strong text-text-secondary">
            <Plus aria-hidden className="size-icon-sm" />
          </span>
        }
        label={t('settings.models.addProvider')}
        description={
          factories.length
            ? t('settings.models.addProviderHint', { count: factories.length })
            : undefined
        }
      >
        <Button variant="outline" size="sm" onClick={onManage}>
          {t('settings.models.browse')}
        </Button>
      </SettingRow>
    </SettingSection>
  )
}
