import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { GatewayOverview } from '@/api/model-gateway'
import { SectionCard } from '@/components/patterns'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { getCurrentLanguage } from '@/locales/i18n'
import { formatCost } from '../../pricing'
import { PREFIX, formatCompact, formatCount } from '../../utils'

const MAX_LABELS = 8
type Metric = 'requests' | 'tokens' | 'spend'

/** Day buckets are UTC days; hour buckets read best in local time. */
function bucketLabel(start: string, bucket: GatewayOverview['bucket']) {
  const date = new Date(start)
  return bucket === 'day'
    ? new Intl.DateTimeFormat(getCurrentLanguage(), {
        month: 'numeric',
        day: 'numeric',
        timeZone: 'UTC',
      }).format(date)
    : new Intl.DateTimeFormat(getCurrentLanguage(), {
        hour: '2-digit',
        minute: '2-digit',
      }).format(date)
}

/**
 * Requests per bucket as stacked bars: failed on top of succeeded, both from
 * one zero baseline, or the tokens of each bucket. Each bar names its
 * numbers on hover; a hidden table carries the same figures for screen
 * readers.
 */
export function RequestsChart({ overview }: { overview: GatewayOverview }) {
  const { t } = useTranslation()
  const { series, bucket } = overview
  // Servers before the token series send requests only.
  const hasTokens = series.some((point) => point.total_tokens !== undefined)
  const [picked, setPicked] = useState<Metric>('requests')
  const hasSpend = series.some((point) => point.spend !== undefined)
  const metric: Metric =
    (picked === 'tokens' && hasTokens) || (picked === 'spend' && hasSpend)
      ? picked
      : 'requests'
  const valueOf = (point: (typeof series)[number]) =>
    metric === 'tokens'
      ? (point.total_tokens ?? 0)
      : metric === 'spend'
        ? (point.spend ?? 0)
        : point.requests
  const peak = Math.max(0, ...series.map(valueOf))
  const step = Math.max(1, Math.ceil(series.length / MAX_LABELS))
  const rows = series.map((point) => ({
    ...point,
    label: bucketLabel(point.start, bucket),
    value: valueOf(point),
    detail:
      metric === 'tokens'
        ? t(`${PREFIX}.overview.chartBarTokens`, {
            time: bucketLabel(point.start, bucket),
            tokens: formatCount(point.total_tokens ?? 0),
          })
        : metric === 'spend'
          ? t(`${PREFIX}.overview.chartBarSpend`, {
              time: bucketLabel(point.start, bucket),
              value: formatCost(point.spend ?? 0),
            })
          : t(`${PREFIX}.overview.chartBar`, {
              time: bucketLabel(point.start, bucket),
              requests: formatCount(point.requests),
              errors: formatCount(point.errors),
            }),
  }))
  return (
    <SectionCard
      padding="default"
      title={t(
        metric === 'tokens'
          ? `${PREFIX}.overview.chartTitleTokens.${bucket}`
          : metric === 'spend'
            ? `${PREFIX}.overview.chartTitleSpend.${bucket}`
            : `${PREFIX}.overview.chartTitle.${bucket}`,
      )}
      actions={
        <div className="flex flex-wrap items-center justify-end gap-space-md text-xs text-fg-muted">
          {metric === 'requests' ? (
            <>
              <span className="inline-flex items-center gap-space-xs">
                <span
                  aria-hidden="true"
                  className="size-2 rounded-radius-sm bg-accent-solid"
                />
                {t(`${PREFIX}.overview.chartSuccess`)}
              </span>
              <span className="inline-flex items-center gap-space-xs">
                <span
                  aria-hidden="true"
                  className="size-2 rounded-radius-sm bg-warning-fg"
                />
                {t(`${PREFIX}.overview.chartFailed`)}
              </span>
            </>
          ) : (
            <span className="tabular-nums">
              {t(`${PREFIX}.overview.chartPeak`, {
                value:
                  metric === 'spend' ? formatCost(peak) : formatCompact(peak),
              })}
            </span>
          )}
          {hasTokens ? (
            <SegmentedControl
              size="sm"
              aria-label={t(`${PREFIX}.overview.chartMetric`)}
              value={metric}
              onValueChange={setPicked}
              options={[
                {
                  value: 'requests',
                  label: t(`${PREFIX}.overview.requests`),
                },
                { value: 'tokens', label: t(`${PREFIX}.overview.tokens`) },
                ...(hasSpend
                  ? [
                      {
                        value: 'spend' as const,
                        label: t(`${PREFIX}.overview.spend`),
                      },
                    ]
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
          <div
            aria-hidden="true"
            className="flex h-36 items-end gap-0.5 border-b border-viz-axis"
          >
            {rows.map((row) => {
              const errors = metric === 'requests' ? row.errors : 0
              const ok = Math.max(0, row.value - errors)
              return (
                <div
                  key={row.start}
                  title={row.detail}
                  className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-0.5 rounded-t-radius-sm hover:bg-fill-hover"
                >
                  {errors > 0 ? (
                    <div
                      className="min-h-0.5 w-full max-w-12 rounded-t-radius-sm bg-warning-fg"
                      style={{ height: `${(errors / peak) * 100}%` }}
                    />
                  ) : null}
                  {ok > 0 ? (
                    <div
                      className={
                        errors > 0
                          ? 'w-full max-w-12 bg-accent-solid'
                          : 'w-full max-w-12 rounded-t-radius-sm bg-accent-solid'
                      }
                      style={{ height: `${(ok / peak) * 100}%` }}
                    />
                  ) : null}
                </div>
              )
            })}
          </div>
          <div aria-hidden="true" className="mt-space-xs flex gap-0.5">
            {rows.map((row, index) => (
              <span
                key={row.start}
                className="min-w-0 flex-1 overflow-visible text-center text-xs whitespace-nowrap text-fg-subtle"
              >
                {index % step === 0 ? row.label : ''}
              </span>
            ))}
          </div>
          <table className="sr-only">
            <caption>{t(`${PREFIX}.overview.chartTitle.${bucket}`)}</caption>
            <tbody>
              {rows.map((row) => (
                <tr key={row.start}>
                  <td>{row.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </figure>
      )}
    </SectionCard>
  )
}
