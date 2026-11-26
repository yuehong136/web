import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  GATEWAY_WINDOWS,
  type GatewayCatalog,
  type GatewayKey,
  type GatewayWindow,
} from '@/api/model-gateway'
import { PageErrorState, PageLoadingState } from '@/components/patterns'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { useFetchGatewayOverview } from '@/hooks/use-model-gateway-request'
import type { GatewayNavigate } from '../../constants'
import { PREFIX } from '../../utils'
import { EndpointCard } from './endpoint-card'
import { KpiRow } from './kpi-row'
import { RecentFailures } from './recent-failures'
import { RequestsChart } from './requests-chart'
import { TopKeys, TopModels } from './top-lists'

interface OverviewPanelProps {
  catalog: GatewayCatalog
  keys: GatewayKey[]
  onNavigate: GatewayNavigate
}

/** How to connect, and how the gateway was used in the chosen window. */
export function OverviewPanel({
  catalog,
  keys,
  onNavigate,
}: OverviewPanelProps) {
  const { t } = useTranslation()
  const [days, setDays] = useState<GatewayWindow>(7)
  const overviewQuery = useFetchGatewayOverview(days)
  const overview = overviewQuery.data

  if (overviewQuery.isPending) return <PageLoadingState compact />
  if (!overview)
    return (
      <PageErrorState
        compact
        titleAs="h3"
        title={t(`${PREFIX}.overview.loadFailed`)}
        retryLabel={t('common.retry')}
        onRetry={() => void overviewQuery.refetch()}
      />
    )

  return (
    <div
      className="flex flex-col gap-space-lg"
      aria-busy={overviewQuery.isPlaceholderData || undefined}
    >
      <EndpointCard
        overview={overview}
        catalog={catalog}
        onViewModels={() => onNavigate('models')}
      />
      <div className="flex flex-wrap items-center justify-between gap-space-md">
        <h2 className="text-base font-semibold text-fg">
          {t(`${PREFIX}.overview.usageTitle`)}
        </h2>
        <SegmentedControl
          size="sm"
          aria-label={t(`${PREFIX}.overview.windowLabel`)}
          value={String(days)}
          onValueChange={(value) => setDays(Number(value) as GatewayWindow)}
          options={GATEWAY_WINDOWS.map((value) => ({
            value: String(value),
            label: t(`${PREFIX}.overview.windows.${value}`),
          }))}
        />
      </div>
      <KpiRow overview={overview} catalog={catalog} />
      <RequestsChart overview={overview} />
      <div className="grid gap-space-md lg:grid-cols-2">
        <TopModels overview={overview} onViewAll={() => onNavigate('models')} />
        <TopKeys
          overview={overview}
          keys={keys}
          onViewAll={() => onNavigate('keys')}
        />
      </div>
      <RecentFailures
        overview={overview}
        onViewLogs={() =>
          onNavigate('logs', { outcome: 'error', range: String(days) })
        }
      />
    </div>
  )
}
