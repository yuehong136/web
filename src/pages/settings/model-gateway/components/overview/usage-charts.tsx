import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { GatewayOverview } from '@/api/model-gateway'
import {
  ChartCard,
  ChartTooltipCard,
  TimeSeriesChart,
  useChartTheme,
  type ChartVariant,
  type TimeSeriesMark,
} from '@/components/charts'
import { getCurrentLanguage } from '@/locales/i18n'
import { formatCost } from '../../pricing'
import {
  PREFIX,
  formatCompact,
  formatCount,
  formatDuration,
  formatPercent,
} from '../../utils'

/** Day buckets are UTC days; hour buckets read best in local time. */
function bucketLabel(
  start: string,
  bucket: GatewayOverview['bucket'],
  full = false,
) {
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

/** One bucket as the charts read it; per-model figures sit under `requests_0`, `spend_0`, … in `series_models` order. */
export type UsageRow = {
  start: string
  /** The bucket on the axis. */
  label: string
  /** The bucket with its date, for the tooltip. */
  title: string
  requests: number
  succeeded: number
  errors: number
  tokens: number
  prompt: number
  completion: number
  spend: number
  p50: number | null
  p95: number | null
  firstToken: number | null
} & Record<string, number | string | null>

/** The series as chart rows: failed calls apart from succeeded ones, tokens by direction, and each model's share. */
export function usageRows(overview: GatewayOverview): UsageRow[] {
  const models = overview.series_models ?? []
  return overview.series.map((point) => {
    const row: UsageRow = {
      start: point.start,
      label: bucketLabel(point.start, overview.bucket),
      title: bucketLabel(point.start, overview.bucket, true),
      requests: point.requests,
      succeeded: Math.max(0, point.requests - point.errors),
      errors: point.errors,
      tokens: point.total_tokens ?? 0,
      prompt: point.prompt_tokens ?? 0,
      completion: point.completion_tokens ?? 0,
      spend: point.spend ?? 0,
      p50: point.latency?.p50_ms ?? null,
      p95: point.latency?.p95_ms ?? null,
      firstToken: point.latency?.first_token_p50_ms ?? null,
    }
    models.forEach((model, index) => {
      const share = point.models?.[model.model_id]
      row[`requests_${index}`] = share?.requests ?? 0
      row[`spend_${index}`] = share?.spend ?? 0
    })
    return row
  })
}

function SeriesCard({
  title,
  total,
  totalHint,
  rows,
  marks,
  format,
  formatExact = format,
  sum,
  lines = false,
  empty,
  children,
}: {
  title: string
  total: ReactNode
  totalHint?: ReactNode
  rows: UsageRow[]
  marks: TimeSeriesMark[]
  /** Axis ticks. */
  format: (value: number) => string
  /** Tooltip figures; defaults to the axis format. */
  formatExact?: (value: number) => string
  /** The tooltip's headline row, for charts whose marks add up. */
  sum?: { label: string; of: (row: UsageRow) => number }
  /** Series that do not add up (percentiles) are lines only. */
  lines?: boolean
  empty: string | null
  children?: ReactNode
}) {
  const { t } = useTranslation()
  const [picked, setPicked] = useState<ChartVariant>('bar')
  const variant = lines ? 'line' : picked
  return (
    <ChartCard
      title={title}
      total={total}
      totalHint={totalHint}
      legend={marks}
      variant={lines ? undefined : variant}
      onVariantChange={setPicked}
      variantLabels={{
        group: t(`${PREFIX}.overview.chartType.label`),
        bar: t(`${PREFIX}.overview.chartType.bar`),
        line: t(`${PREFIX}.overview.chartType.line`),
      }}
      empty={empty}
    >
      <TimeSeriesChart
        data={rows}
        xKey="label"
        marks={marks}
        variant={variant}
        formatValue={format}
        label={title}
        renderTooltip={(row) => (
          <ChartTooltipCard
            title={row.title}
            rows={[
              ...(sum
                ? [
                    {
                      label: sum.label,
                      value: formatExact(sum.of(row)),
                      strong: true,
                    },
                  ]
                : []),
              ...marks
                .filter((mark) => row[mark.key] !== null)
                .filter((mark) => !sum || Number(row[mark.key]) > 0)
                .map((mark) => ({
                  label: mark.label,
                  color: mark.color,
                  value: formatExact(Number(row[mark.key])),
                })),
            ]}
          />
        )}
      />
      {children}
    </ChartCard>
  )
}

/**
 * The window as a grid of charts, one question each: how many calls and how
 * many failed, how many tokens went in and out, what it cost and which models
 * spent it, which models were called, and how long answers took.
 */
export function UsageCharts({
  overview,
  children,
}: {
  overview: GatewayOverview
  /** Further cards of the same grid. */
  children?: ReactNode
}) {
  const { t } = useTranslation()
  const theme = useChartTheme()
  const rows = usageRows(overview)
  const { totals } = overview
  const text = (key: string, values?: Record<string, unknown>) =>
    t(`${PREFIX}.overview.${key}`, values ?? {})
  const none = totals.requests === 0 ? text('chartEmpty') : null
  const models = overview.series_models ?? []
  const modelMarks = (field: 'requests' | 'spend'): TimeSeriesMark[] =>
    models.map((model, index) => ({
      key: `${field}_${index}`,
      label: model.name ?? text('otherModels'),
      // The busiest model takes the accent, the rest their identity colours;
      // every model outside the busiest five is one grey remainder.
      color:
        model.name === null
          ? theme.tick
          : index === 0
            ? theme.accent
            : theme.palette[index % theme.palette.length],
      stackId: 'models',
    }))
  // Servers before the token split send one figure per bucket.
  const splitTokens = overview.series.some(
    (point) => point.prompt_tokens !== undefined,
  )
  const hasLatency = rows.some((row) => row.p50 !== null)
  const spent = (totals.spend ?? 0) > 0
  return (
    <div className="grid gap-space-md xl:grid-cols-2">
      <SeriesCard
        title={text('charts.requests')}
        total={formatCount(totals.requests)}
        totalHint={
          totals.requests > 0
            ? text('failureRateOf', {
                value: formatPercent(totals.errors / totals.requests),
              })
            : undefined
        }
        rows={rows}
        format={formatCompact}
        formatExact={formatCount}
        sum={{ label: text('requests'), of: (row) => row.requests }}
        empty={none}
        marks={[
          {
            key: 'succeeded',
            label: text('chartSuccess'),
            color: theme.accent,
            stackId: 'calls',
          },
          {
            key: 'errors',
            label: text('chartFailed'),
            color: theme.warning,
            stackId: 'calls',
          },
        ]}
      >
        <table className="sr-only">
          <caption>{text('charts.requests')}</caption>
          <tbody>
            {rows.map((row) => (
              <tr key={row.start}>
                <td>
                  {text('chartBar', {
                    time: row.title,
                    requests: formatCount(row.requests),
                    errors: formatCount(row.errors),
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SeriesCard>
      <SeriesCard
        title={text('charts.tokens')}
        total={formatCompact(totals.total_tokens)}
        totalHint={text('tokensSplit', {
          prompt: formatCompact(totals.prompt_tokens),
          completion: formatCompact(totals.completion_tokens),
        })}
        rows={rows}
        format={formatCompact}
        formatExact={formatCount}
        sum={{ label: text('tokens'), of: (row) => row.tokens }}
        empty={totals.total_tokens === 0 ? text('chartEmpty') : null}
        marks={
          splitTokens
            ? [
                {
                  key: 'prompt',
                  label: text('inputTokens'),
                  color: theme.accent,
                  stackId: 'tokens',
                },
                {
                  key: 'completion',
                  label: text('outputTokens'),
                  color: theme.palette[1],
                  stackId: 'tokens',
                },
              ]
            : [
                {
                  key: 'tokens',
                  label: text('tokens'),
                  color: theme.accent,
                  stackId: 'tokens',
                },
              ]
        }
      />
      {totals.spend === undefined ? null : (
        <SeriesCard
          title={text('charts.spend')}
          total={formatCost(totals.spend)}
          totalHint={
            totals.requests > 0 && spent
              ? text('spendPerRequest', {
                  value: formatCost(totals.spend / totals.requests),
                })
              : undefined
          }
          rows={rows}
          format={formatCost}
          sum={{ label: text('spend'), of: (row) => row.spend }}
          empty={spent ? null : text('spendHint')}
          marks={modelMarks('spend')}
        />
      )}
      <SeriesCard
        title={text('charts.models')}
        total={formatCount(models.filter((model) => model.name).length)}
        totalHint={text('modelsCalled')}
        rows={rows}
        format={formatCompact}
        formatExact={formatCount}
        sum={{ label: text('requests'), of: (row) => row.requests }}
        empty={models.length === 0 ? text('chartEmpty') : null}
        marks={modelMarks('requests')}
      />
      <SeriesCard
        lines
        title={text('charts.latency')}
        total={
          totals.duration_p50_ms == null
            ? t(`${PREFIX}.common.empty`)
            : formatDuration(totals.duration_p50_ms)
        }
        totalHint={
          totals.duration_p95_ms == null
            ? undefined
            : text('latencyP95', {
                value: formatDuration(totals.duration_p95_ms),
              })
        }
        rows={rows}
        format={formatDuration}
        empty={hasLatency ? null : text('latencyNone')}
        marks={[
          { key: 'p50', label: 'P50', color: theme.accent },
          { key: 'p95', label: 'P95', color: theme.warning },
          {
            key: 'firstToken',
            label: text('firstToken'),
            color: theme.success,
          },
        ]}
      />
      {children}
    </div>
  )
}
