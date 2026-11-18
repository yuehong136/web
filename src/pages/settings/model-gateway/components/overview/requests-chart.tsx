import { useTranslation } from 'react-i18next'
import type { GatewayOverview } from '@/api/model-gateway'
import { SectionCard } from '@/components/patterns'
import { getCurrentLanguage } from '@/locales/i18n'
import { PREFIX, formatCount } from '../../utils'

const MAX_LABELS = 8

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
 * one zero baseline. Each bar names its numbers on hover; a hidden table
 * carries the same figures for screen readers.
 */
export function RequestsChart({ overview }: { overview: GatewayOverview }) {
  const { t } = useTranslation()
  const { series, bucket } = overview
  const peak = Math.max(0, ...series.map((point) => point.requests))
  const step = Math.max(1, Math.ceil(series.length / MAX_LABELS))
  const rows = series.map((point) => ({
    ...point,
    label: bucketLabel(point.start, bucket),
    detail: t(`${PREFIX}.overview.chartBar`, {
      time: bucketLabel(point.start, bucket),
      requests: formatCount(point.requests),
      errors: formatCount(point.errors),
    }),
  }))
  return (
    <SectionCard
      padding="default"
      title={t(`${PREFIX}.overview.chartTitle.${bucket}`)}
      actions={
        <div className="flex items-center gap-space-md text-xs text-fg-muted">
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
              const ok = Math.max(0, row.requests - row.errors)
              return (
                <div
                  key={row.start}
                  title={row.detail}
                  className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-0.5 rounded-t-radius-sm hover:bg-fill-hover"
                >
                  {row.errors > 0 ? (
                    <div
                      className="min-h-0.5 w-full max-w-12 rounded-t-radius-sm bg-warning-fg"
                      style={{ height: `${(row.errors / peak) * 100}%` }}
                    />
                  ) : null}
                  {ok > 0 ? (
                    <div
                      className={
                        row.errors > 0
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
