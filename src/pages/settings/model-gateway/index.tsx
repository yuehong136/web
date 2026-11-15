import { useState } from 'react'
import { PowerOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { isMissingRouteError } from '@/api/legacy-fallback'
import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
} from '@/components/patterns'
import {
  SegmentedTabs,
  SegmentedTabsContent,
  SegmentedTabsList,
  SegmentedTabsTrigger,
} from '@/components/ui/segmented-tabs'
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

  if (modelsQuery.isPending || keysQuery.isPending)
    return <PageLoadingState title={t('settings.modelGateway.loading')} />

  const error = modelsQuery.error ?? keysQuery.error
  if (isMissingRouteError(error))
    return (
      <PageEmptyState
        title={t('settings.modelGateway.disabled.title')}
        description={t('settings.modelGateway.disabled.description')}
        icon={<PowerOff className="size-icon-lg" aria-hidden="true" />}
      />
    )
  if (error)
    return (
      <PageErrorState
        titleAs="h2"
        title={t('settings.modelGateway.loadFailed')}
        retryLabel={t('common.retry')}
        onRetry={() => {
          void modelsQuery.refetch()
          void keysQuery.refetch()
        }}
      />
    )

  const models = modelsQuery.data ?? []
  const keys = keysQuery.data ?? []

  return (
    <SegmentedTabs
      value={tab}
      onValueChange={(value) => setTab(value as GatewayTab)}
      className="flex h-full min-h-0 flex-col"
    >
      <div className="px-space-lg pt-space-lg">
        <SegmentedTabsList aria-label={t('settings.modelGateway.tabsLabel')}>
          {TABS.map((item) => (
            <SegmentedTabsTrigger key={item} value={item}>
              {t(`settings.modelGateway.tabs.${item}`)}
            </SegmentedTabsTrigger>
          ))}
        </SegmentedTabsList>
      </div>
      <div className="scroll-area min-h-0 flex-1 overflow-y-auto p-space-lg">
        <SegmentedTabsContent value="models">
          <ModelsPanel models={models} />
        </SegmentedTabsContent>
        <SegmentedTabsContent value="keys">
          <KeysPanel keys={keys} models={models} />
        </SegmentedTabsContent>
        <SegmentedTabsContent value="logs">
          <LogsPanel keys={keys} models={models} />
        </SegmentedTabsContent>
        <SegmentedTabsContent value="usage">
          <UsagePanel />
        </SegmentedTabsContent>
      </div>
    </SegmentedTabs>
  )
}
