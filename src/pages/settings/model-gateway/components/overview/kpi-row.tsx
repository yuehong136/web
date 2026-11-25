import { useTranslation } from 'react-i18next'
import type { GatewayOverview } from '@/api/model-gateway'
import { StatCard } from '@/components/patterns'
import {
  PREFIX,
  formatChange,
  formatCompact,
  formatCount,
  formatDuration,
  formatPercent,
} from '../../utils'
import { formatCost } from '../../pricing'

/** Requests, tokens, failure rate and first-token latency of the window. */
export function KpiRow({ overview }: { overview: GatewayOverview }) {
  const { t } = useTranslation()
  const { totals, previous_requests: previous } = overview
  const failureRate = totals.requests ? totals.errors / totals.requests : 0
  const topError = overview.errors_by_code[0]
  return (
    <section
      aria-label={t(`${PREFIX}.overview.usageTitle`)}
      className={
        totals.spend === undefined
          ? 'grid gap-space-md sm:grid-cols-2 xl:grid-cols-4'
          : 'grid gap-space-md sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5'
      }
    >
      <StatCard
        title={t(`${PREFIX}.overview.requests`)}
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
        value={formatCompact(totals.total_tokens)}
        description={t(`${PREFIX}.overview.tokensSplit`, {
          prompt: formatCompact(totals.prompt_tokens),
          completion: formatCompact(totals.completion_tokens),
        })}
      />
      {totals.spend === undefined ? null : (
        <StatCard
          title={t(`${PREFIX}.overview.spend`)}
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
    </section>
  )
}
