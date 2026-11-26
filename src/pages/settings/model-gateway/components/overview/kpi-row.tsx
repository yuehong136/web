import {
  Activity,
  CircleDollarSign,
  HeartPulse,
  Timer,
  TriangleAlert,
  Type,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { GatewayCatalog, GatewayOverview } from '@/api/model-gateway'
import { StatCard } from '@/components/patterns'
import {
  PREFIX,
  formatChange,
  formatCompact,
  formatCount,
  formatDuration,
  formatPercent,
} from '../../utils'
import { isCallable } from '../../catalog'
import { formatCost } from '../../pricing'

const ICON = 'size-icon-sm'

/** Callable models by what the last health check found; `null` before any check. */
export function healthCounts(catalog: GatewayCatalog) {
  const checked = catalog.models.filter(
    (model) => isCallable(model) && model.health,
  )
  if (checked.length === 0) return null
  const count = (status: string) =>
    checked.filter((model) => model.health?.status === status).length
  return {
    total: checked.length,
    healthy: count('healthy'),
    limited: count('rate_limited'),
    failing: count('unhealthy'),
  }
}

/**
 * The window in six numbers: requests, tokens, spend, failure rate,
 * first-token latency, and how many upstream models are healthy right now.
 */
export function KpiRow({
  overview,
  catalog,
}: {
  overview: GatewayOverview
  catalog: GatewayCatalog
}) {
  const { t } = useTranslation()
  const health = healthCounts(catalog)
  const { totals, previous_requests: previous } = overview
  const failureRate = totals.requests ? totals.errors / totals.requests : 0
  const topError = overview.errors_by_code[0]
  return (
    <section
      aria-label={t(`${PREFIX}.overview.usageTitle`)}
      className="grid gap-space-md sm:grid-cols-2 lg:grid-cols-3"
    >
      <StatCard
        title={t(`${PREFIX}.overview.requests`)}
        icon={<Activity className={ICON} aria-hidden="true" />}
        tone="info"
        value={formatCount(totals.requests)}
        description={
          previous > 0
            ? t(`${PREFIX}.overview.requestsChange`, {
                value: formatChange((totals.requests - previous) / previous),
              })
            : t(`${PREFIX}.overview.requestsNoPrevious`)
        }
      />
      <StatCard
        title={t(`${PREFIX}.overview.tokens`)}
        icon={<Type className={ICON} aria-hidden="true" />}
        value={formatCompact(totals.total_tokens)}
        description={t(`${PREFIX}.overview.tokensSplit`, {
          prompt: formatCompact(totals.prompt_tokens),
          completion: formatCompact(totals.completion_tokens),
        })}
      />
      {totals.spend === undefined ? null : (
        <StatCard
          title={t(`${PREFIX}.overview.spend`)}
          icon={<CircleDollarSign className={ICON} aria-hidden="true" />}
          value={formatCost(totals.spend)}
          description={
            totals.requests > 0 && totals.spend > 0
              ? t(`${PREFIX}.overview.spendPerRequest`, {
                  value: formatCost(totals.spend / totals.requests),
                })
              : t(`${PREFIX}.overview.spendHint`)
          }
        />
      )}
      <StatCard
        title={t(`${PREFIX}.overview.failureRate`)}
        icon={<TriangleAlert className={ICON} aria-hidden="true" />}
        tone={
          failureRate >= 0.2
            ? 'error'
            : failureRate >= 0.05
              ? 'warning'
              : 'neutral'
        }
        value={formatPercent(failureRate)}
        description={
          topError && totals.errors > 0
            ? t(`${PREFIX}.overview.failureDetail`, {
                value: formatCount(totals.errors),
                code: topError.status_code,
                share: formatPercent(topError.count / totals.errors, 0),
              })
            : t(`${PREFIX}.overview.failureNone`)
        }
      />
      <StatCard
        title={t(`${PREFIX}.overview.firstToken`)}
        icon={<Timer className={ICON} aria-hidden="true" />}
        value={
          totals.first_token_p50_ms === null
            ? t(`${PREFIX}.common.empty`)
            : formatDuration(totals.first_token_p50_ms)
        }
        description={t(
          totals.first_token_p50_ms === null
            ? `${PREFIX}.overview.firstTokenNone`
            : `${PREFIX}.overview.firstTokenHint`,
        )}
      />
      <StatCard
        title={t(`${PREFIX}.overview.health`)}
        icon={<HeartPulse className={ICON} aria-hidden="true" />}
        tone={
          !health
            ? 'neutral'
            : health.failing > 0
              ? 'error'
              : health.limited > 0
                ? 'warning'
                : 'success'
        }
        value={
          health
            ? t(`${PREFIX}.overview.healthValue`, {
                healthy: health.healthy,
                total: health.total,
              })
            : t(`${PREFIX}.common.empty`)
        }
        description={
          !health
            ? t(`${PREFIX}.overview.healthNone`)
            : health.failing + health.limited === 0
              ? t(`${PREFIX}.overview.healthAll`)
              : [
                  health.failing > 0
                    ? t(`${PREFIX}.models.healthCount.unhealthy`, {
                        count: health.failing,
                      })
                    : null,
                  health.limited > 0
                    ? t(`${PREFIX}.models.healthCount.rate_limited`, {
                        count: health.limited,
                      })
                    : null,
                ]
                  .filter(Boolean)
                  .join(' · ')
        }
      />
    </section>
  )
}
