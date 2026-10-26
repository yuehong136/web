import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useModelProviders,
  useModelProviderMutation,
} from '@/hooks/use-model-provider-request'
import { SystemSetting } from './components/system-setting'
import { UsedModels } from './components/used-models'
import { AvailableModels } from './components/available-models'
import { ApiKeyModal } from './components/api-key-modal'
import {
  buildInstancePayload,
  saveProviderInstance,
} from './components/instance-payload'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ModelProvidersPage() {
  const { t } = useTranslation()
  const providers = useModelProviders(),
    mutation = useModelProviderMutation()
  const [provider, setProvider] = useState(''),
    [name, setName] = useState(''),
    [region, setRegion] = useState('')
  const [partial, setPartial] = useState(false)
  const created = useRef<string | null>(null)
  const close = () => {
    setProvider('')
    setName('')
    setRegion('')
    created.current = null
    setPartial(false)
  }
  const open = (value: string) => {
    close()
    setProvider(value)
  }
  return (
    <div className="@container flex h-full min-h-0 flex-col gap-space-lg p-space-lg">
      <div className="relative flex min-h-0 flex-1 flex-col overflow-auto rounded-radius-lg border border-border-default bg-background-surface @4xl:flex-row @4xl:overflow-hidden">
        <section className="flex shrink-0 flex-col gap-space-base p-space-base @4xl:w-3/5 @4xl:overflow-auto @4xl:border-r @4xl:border-border-subtle">
          <SystemSetting />
          <UsedModels handleAddModel={open} />
        </section>
        <section className="flex shrink-0 flex-col @4xl:w-2/5 @4xl:overflow-auto">
          <AvailableModels handleAddModel={open} />
        </section>
      </div>
      <ApiKeyModal
        isOpen={!!provider}
        providerName={provider}
        onClose={close}
        onSave={async (key, baseUrl, fields = {}) => {
          if (!providers.data || providers.isError)
            throw Error('provider-inventory-unavailable')
          const payload = buildInstancePayload(
            provider,
            name,
            key,
            baseUrl,
            fields,
            region,
          )
          await mutation.mutateAsync(async (isCurrent) =>
            saveProviderInstance({
              provider,
              providerExists: providers.data.some(
                (item) => item.name === provider,
              ),
              payload,
              createdIdentity: created.current,
              isCurrent,
              onCreated: (identity) => {
                created.current = identity
                setPartial(!!payload.model)
              },
            }),
          )
        }}
      >
        <div className="flex flex-col gap-space-sm">
          <Label htmlFor="model-instance-name">
            {t('settings.models.instances.name')}
          </Label>
          <Input
            id="model-instance-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            disabled={mutation.isPending}
          />
          <Label htmlFor="model-instance-region">
            {t('settings.models.instances.region')}
          </Label>
          <Input
            id="model-instance-region"
            value={region}
            onChange={(event) => setRegion(event.target.value)}
            disabled={mutation.isPending}
          />
          {partial && (
            <p role="status" className="text-text-secondary">
              {t('settings.models.instances.partial')}
            </p>
          )}
        </div>
      </ApiKeyModal>
    </div>
  )
}
export default ModelProvidersPage
