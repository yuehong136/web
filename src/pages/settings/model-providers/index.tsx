import { useFetchFactories } from '@/hooks/use-llm-request'
import { ProviderRegionField } from './components/provider-region-field'
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
import { useSearchParams } from 'react-router-dom'
import { SettingsTemplate } from '@/components/page-templates/settings-template'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConnectedProviders } from './components/connected-providers'
import { Label } from '@/components/ui/label'

type ModelsTab = 'defaults' | 'providers'

export function ModelProvidersPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const tab: ModelsTab =
    params.get('tab') === 'providers' ? 'providers' : 'defaults'
  const setTab = (next: ModelsTab) =>
    setParams(next === 'defaults' ? {} : { tab: next }, { replace: true })
  const mutation = useModelProviderMutation()
  const { factories } = useFetchFactories()
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
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value as ModelsTab)}
      className="h-full"
    >
      <SettingsTemplate
        tabs={
          <TabsList
            aria-label={t('settings.models.tabs.label')}
            className="min-h-0 border-b-0"
          >
            <TabsTrigger value="defaults">
              {t('settings.models.tabs.defaults')}
            </TabsTrigger>
            <TabsTrigger value="providers">
              {t('settings.models.tabs.providers')}
            </TabsTrigger>
          </TabsList>
        }
        title={t(
          tab === 'defaults'
            ? 'settings.models.defaults'
            : 'settings.models.tabs.providers',
        )}
        description={t(
          tab === 'defaults'
            ? 'settings.models.defaultDescription'
            : 'settings.models.providersDescription',
        )}
      >
        <TabsContent value="defaults" className="mt-0">
          <SystemSetting />
          <ConnectedProviders onManage={() => setTab('providers')} />
        </TabsContent>
        <TabsContent value="providers" className="mt-0">
          <UsedModels handleAddModel={open} />
          <AvailableModels handleAddModel={open} />
        </TabsContent>
      </SettingsTemplate>
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
        {(invalidate) => (
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
            <ProviderRegionField
              provider={provider}
              value={region}
              onChange={(value) => {
                invalidate()
                setRegion(value)
              }}
              urls={factories.find((item) => item.name === provider)?.url}
            />
          </div>
        )}
      </ApiKeyModal>
    </Tabs>
  )
}
export default ModelProvidersPage
