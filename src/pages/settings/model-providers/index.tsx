import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useModelProviderMutation } from '@/hooks/use-model-provider-request'
import { SystemSetting } from './components/system-setting'
import { UsedModels } from './components/used-models'
import { AvailableModels } from './components/available-models'
import { ApiKeyModal } from './components/api-key-modal'
import {
  ModelDiscoveryDialog,
  supportsModelDiscovery,
} from './components/model-discovery-dialog'
import {
  buildInstancePayload,
  buildConnectionCandidate,
  saveProviderInstance,
} from './components/instance-payload'
import { apiClient } from '@/api/client'
import { modelProvidersAPI } from '@/api/llm-providers'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ModelProvidersPage() {
  const { t } = useTranslation()
  const mutation = useModelProviderMutation()
  const [manualMode, setManualMode] = useState(false)
  const [provider, setProvider] = useState(''),
    [name, setName] = useState(''),
    [region, setRegion] = useState('')
  const close = () => {
    setProvider('')
    setName('')
    setRegion('')
    setManualMode(false)
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
      {provider && supportsModelDiscovery(provider) && !manualMode && (
        <ModelDiscoveryDialog
          provider={provider}
          close={close}
          configureManually={() => setManualMode(true)}
        />
      )}
      <ApiKeyModal
        isOpen={!!provider && (!supportsModelDiscovery(provider) || manualMode)}
        providerName={provider}
        onClose={close}
        onVerify={async (key, baseUrl, fields = {}) => {
          const isCurrent = apiClient.captureOwner()
          const candidate = buildConnectionCandidate(
            provider,
            key,
            baseUrl,
            fields,
            region,
          )
          await modelProvidersAPI.verifyConnection(provider, candidate)
          if (!isCurrent())
            throw new DOMException('Request superseded', 'AbortError')
          return { isValid: true, logs: '' }
        }}
        onSave={async (key, baseUrl, fields = {}) => {
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
              payload,
              isCurrent,
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
          />
          <Label htmlFor="model-instance-region">
            {t('settings.models.instances.region')}
          </Label>
          <Input
            id="model-instance-region"
            value={region}
            onChange={(event) => setRegion(event.target.value)}
          />
        </div>
      </ApiKeyModal>
    </div>
  )
}
export default ModelProvidersPage
