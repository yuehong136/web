import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { GatewayOverview } from '@/api/model-gateway'
import {
  ChartTooltipCard,
  TimeSeriesChart,
  useChartTheme,
  type TimeSeriesMark,
} from '@/components/charts'
import { SectionCard } from '@/components/patterns'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { getCurrentLanguage } from '@/locales/i18n'
import { formatCost } from '../../pricing'
import { PREFIX, formatCompact, formatCount, formatPercent } from '../../utils'

type Metric = 'requests' | 'tokens' | 'spend'
type Bucket = GatewayOverview['bucket']

/** Day buckets are UTC days; hour buckets read best in local time. */
function bucketLabel(start: string, bucket: Bucket, full = false) {
  const date = new Date(start)
  return bucket === 'day'
    ? new Intl.DateTimeFormat(getCurrentLanguage(), {
        month: 'numeric',
        day: 'numeric',
        weekday: full ? 'short' : undefined,
        timeZone: 'UTC',
      }).format(date)
    : new Intl.DateTimeFormat(getCurrentLanguage(), {
        month: full ? 'numeric' : undefined,
        day: full ? 'numeric' : undefined,
        hour: '2-digit',
        minute: '2-digit',
      }).format(date)
}

export interface ChartRow {
  start: string
  /** The bucket on the axis. */
  label: string
  /** The bucket with its date, for the tooltip. */
  title: string
  requests: number
  succeeded: number
  errors: number
  tokens: number | undefined
  spend: number | undefined
}

/** The series as chart rows: failed calls apart from succeeded ones, so the two stack. */
export function chartRows(overview: GatewayOverview): ChartRow[] {
  return overview.series.map((point) => ({
    start: point.start,
    label: bucketLabel(point.start, overview.bucket),
    title: bucketLabel(point.start, overview.bucket, true),
    requests: point.requests,
    succeeded: Math.max(0, point.requests - point.errors),
    errors: point.errors,
    tokens: point.total_tokens,
    spend: point.spend,
  }))
}

/**
 * Requests, tokens or spend per bucket. Requests are bars with failed calls
 * stacked on succeeded ones; tokens and spend are areas. Whatever is drawn,
 * the tooltip lists every figure of the bucket, and a hidden table carries
 * them for screen readers.
 */
export function RequestsChart({ overview }: { overview: GatewayOverview }) {
  const { t } = useTranslation()
  const theme = useChartTheme()
  const { bucket } = overview
  const rows = chartRows(overview)
  // Servers before the token series send requests only.
  const hasTokens = rows.some((row) => row.tokens !== undefined)
  const hasSpend = rows.some((row) => row.spend !== undefined)
  const [picked, setPicked] = useState<Metric>('requests')
  const metric: Metric =
    (picked === 'tokens' && hasTokens) || (picked === 'spend' && hasSpend)
      ? picked
      : 'requests'
  const peak = Math.max(
    0,
    ...rows.map((row) =>
      metric === 'tokens'
        ? (row.tokens ?? 0)
        : metric === 'spend'
          ? (row.spend ?? 0)
          : row.requests,
    ),
  )
  const format = (value: number) =>
    metric === 'spend' ? formatCost(value) : formatCompact(value)
  const labels = {
    requests: t(`${PREFIX}.overview.requests`),
    succeeded: t(`${PREFIX}.overview.chartSuccess`),
    failed: t(`${PREFIX}.overview.chartFailed`),
    tokens: t(`${PREFIX}.overview.tokens`),
    spend: t(`${PREFIX}.overview.spend`),
  }
  const marks: TimeSeriesMark[] =
    metric === 'tokens'
      ? [
          {
            key: 'tokens',
            label: labels.tokens,
            color: theme.accent,
            kind: 'area',
          },
        ]
      : metric === 'spend'
        ? [
            {
              key: 'spend',
              label: labels.spend,
              color: theme.accent,
              kind: 'area',
            },
          ]
        : [
            {
              key: 'succeeded',
              label: labels.succeeded,
              color: theme.accent,
              kind: 'bar',
              stackId: 'calls',
            },
            {
              key: 'errors',
              label: labels.failed,
              color: theme.warning,
              kind: 'bar',
              stackId: 'calls',
            },
          ]
  const title = t(
    metric === 'tokens'
      ? `${PREFIX}.overview.chartTitleTokens.${bucket}`
      : metric === 'spend'
        ? `${PREFIX}.overview.chartTitleSpend.${bucket}`
        : `${PREFIX}.overview.chartTitle.${bucket}`,
  )

  return (
    <SectionCard
      padding="default"
      title={title}
      actions={
        <div className="flex flex-wrap items-center justify-end gap-space-md text-xs text-fg-muted">
          {metric === 'requests' ? (
            <>
              <span className="inline-flex items-center gap-space-xs">
                <span
                  aria-hidden="true"
                  className="size-2 rounded-radius-sm bg-accent-solid"
                />
                {labels.succeeded}
              </span>
              <span className="inline-flex items-center gap-space-xs">
                <span
                  aria-hidden="true"
                  className="size-2 rounded-radius-sm bg-warning-fg"
                />
                {labels.failed}
              </span>
            </>
          ) : (
            <span className="tabular-nums">
              {t(`${PREFIX}.overview.chartPeak`, { value: format(peak) })}
            </span>
          )}
          {hasTokens ? (
            <SegmentedControl
              size="sm"
              aria-label={t(`${PREFIX}.overview.chartMetric`)}
              value={metric}
              onValueChange={setPicked}
              options={[
                { value: 'requests', label: labels.requests },
                { value: 'tokens', label: labels.tokens },
                ...(hasSpend
                  ? [{ value: 'spend' as const, label: labels.spend }]
                  : []),
              ]}
            />
          ) : null}
        </div>
      }
    >
      {peak === 0 ? (
        <p className="py-space-xl text-center text-sm text-fg-subtle">
          {t(`${PREFIX}.overview.chartEmpty`)}
        </p>
      ) : (
        <figure>
          <figcaption className="sr-only">
            {t(`${PREFIX}.overview.chartSummary`, {
              range: t(`${PREFIX}.overview.windows.${overview.window.days}`),
              requests: formatCount(overview.totals.requests),
              errors: formatCount(overview.totals.errors),
              peak: formatCount(peak),
            })}
          </figcaption>
          <TimeSeriesChart
            data={rows}
            xKey="label"
            marks={marks}
            formatValue={format}
            label={t(`${PREFIX}.overview.chartExplore`)}
            renderTooltip={(row) => (
              <ChartTooltipCard
                title={row.title}
                rows={[
                  {
                    label: labels.requests,
                    value: formatCount(row.requests),
                    strong: true,
                  },
                  {
                    label: labels.succeeded,
                    value: formatCount(row.succeeded),
                    color: theme.accent,
                  },
                  {
                    label: labels.failed,
                    color: theme.warning,
                    value:
                      row.requests > 0
                        ? `${formatCount(row.errors)} · ${formatPercent(row.errors / row.requests)}`
                        : formatCount(row.errors),
                  },
                  ...(row.tokens === undefined
                    ? []
                    : [
                        {
                          label: labels.tokens,
                          value: formatCount(row.tokens),
                        },
                      ]),
                  ...(row.spend === undefined
                    ? []
                    : [{ label: labels.spend, value: formatCost(row.spend) }]),
                ]}
              />
            )}
          />
          <table className="sr-only">
            <caption>{t(`${PREFIX}.overview.chartTitle.${bucket}`)}</caption>
            <tbody>
              {rows.map((row) => (
                <tr key={row.start}>
                  <td>
                    {t(`${PREFIX}.overview.chartBar`, {
                      time: row.title,
                      requests: formatCount(row.requests),
                      errors: formatCount(row.errors),
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </figure>
      )}
    </SectionCard>
  )
}
