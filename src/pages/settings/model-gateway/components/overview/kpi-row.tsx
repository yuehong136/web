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

/** Requests, tokens, failure rate and first-token latency of the window. */
export function KpiRow({ overview }: { overview: GatewayOverview }) {
  const { t } = useTranslation()
  const { totals, previous_requests: previous } = overview
  const failureRate = totals.requests ? totals.errors / totals.requests : 0
  const topError = overview.errors_by_code[0]
  return (
    <section
      aria-label={t(`${PREFIX}.overview.usageTitle`)}
      className="grid gap-space-md sm:grid-cols-2 xl:grid-cols-4"
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
