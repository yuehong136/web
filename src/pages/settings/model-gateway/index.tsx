import { useState } from 'react'
import { PowerOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { isMissingRouteError } from '@/api/legacy-fallback'
import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
} from '@/components/patterns'
import { SettingsTemplate } from '@/components/page-templates/settings-template'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  useFetchGatewayKeys,
  useFetchGatewayModels,
} from '@/hooks/use-model-gateway-request'
import { KeysPanel } from './components/keys-panel'
import { LogsPanel } from './components/logs-panel'
import { ModelsPanel } from './components/models-panel'
import { UsagePanel } from './components/usage-panel'

const TABS = ['models', 'keys', 'logs', 'usage'] as const
type GatewayTab = (typeof TABS)[number]

/**
 * Model gateway management: published models, keys, request logs and usage.
 *
 * The gateway is an optional server feature. While it is off, its routes do
 * not exist, and the page says so instead of showing an error.
 */
export const ModelGatewayPage = () => {
  const { t } = useTranslation()
  const [tab, setTab] = useState<GatewayTab>('models')
  const modelsQuery = useFetchGatewayModels()
  const keysQuery = useFetchGatewayKeys()

  const error = modelsQuery.error ?? keysQuery.error
  const pending = modelsQuery.isPending || keysQuery.isPending
  const models = modelsQuery.data ?? []
  const keys = keysQuery.data ?? []
  const ready = !pending && !error

  let body
  if (pending)
    body = (
      <PageLoadingState compact title={t('settings.modelGateway.loading')} />
    )
  else if (isMissingRouteError(error))
    body = (
      <PageEmptyState
        compact
        title={t('settings.modelGateway.disabled.title')}
        description={t('settings.modelGateway.disabled.description')}
        icon={<PowerOff className="size-icon-lg" aria-hidden="true" />}
      />
    )
  else if (error)
    body = (
      <PageErrorState
        compact
        titleAs="h2"
        title={t('settings.modelGateway.loadFailed')}
        retryLabel={t('common.retry')}
        onRetry={() => {
          void modelsQuery.refetch()
          void keysQuery.refetch()
        }}
      />
    )

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value as GatewayTab)}
      className="h-full"
    >
      <SettingsTemplate
        width="wide"
        tabs={
          ready ? (
            <TabsList
              aria-label={t('settings.modelGateway.tabsLabel')}
              className="min-h-0 border-b-0"
            >
              {TABS.map((item) => (
                <TabsTrigger key={item} value={item}>
                  {t(`settings.modelGateway.tabs.${item}`)}
                </TabsTrigger>
              ))}
            </TabsList>
          ) : undefined
        }
      >
        {body ?? (
          <>
            <TabsContent value="models" className="mt-0">
              <ModelsPanel models={models} />
            </TabsContent>
            <TabsContent value="keys" className="mt-0">
              <KeysPanel keys={keys} models={models} />
            </TabsContent>
            <TabsContent value="logs" className="mt-0">
              <LogsPanel keys={keys} models={models} />
            </TabsContent>
            <TabsContent value="usage" className="mt-0">
              <UsagePanel />
            </TabsContent>
          </>
        )}
      </SettingsTemplate>
    </Tabs>
  )
}
