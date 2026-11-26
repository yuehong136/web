import { useState, type PointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { GatewayOverview } from '@/api/model-gateway'
import { SectionCard } from '@/components/patterns'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { getCurrentLanguage } from '@/locales/i18n'
import { cn } from '@/lib/utils'
import { formatCost } from '../../pricing'
import { PREFIX, formatCompact, formatCount, formatPercent } from '../../utils'

const MAX_LABELS = 8
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

/** The smallest round step times a power of ten that holds the peak, so the scale reads in round numbers. */
export function niceCeiling(peak: number): number {
  if (peak <= 0) return 0
  const power = 10 ** Math.floor(Math.log10(peak))
  const step =
    [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find(
      (factor) => factor * power >= peak,
    ) ?? 10
  return step * power
}

function TipRow({
  label,
  value,
  swatch,
  strong,
}: {
  label: string
  value: string
  swatch?: string
  strong?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-space-lg">
      <dt className="inline-flex items-center gap-space-xs text-fg-muted">
        {swatch ? (
          <span
            aria-hidden="true"
            className={cn('size-2 rounded-radius-sm', swatch)}
          />
        ) : null}
        {label}
      </dt>
      <dd
        className={cn(
          'tabular-nums',
          strong ? 'font-semibold text-fg' : 'text-fg',
        )}
      >
        {value}
      </dd>
    </div>
  )
}

/**
 * Requests, tokens or spend per bucket as bars from one zero baseline, with
 * failed calls stacked on succeeded ones. Pointing at a bucket (or moving to
 * it with the arrow keys) shows all of its numbers at once; a hidden table
 * carries the same figures for screen readers.
 */
export function RequestsChart({ overview }: { overview: GatewayOverview }) {
  const { t } = useTranslation()
  const { series, bucket } = overview
  // Servers before the token series send requests only.
  const hasTokens = series.some((point) => point.total_tokens !== undefined)
  const hasSpend = series.some((point) => point.spend !== undefined)
  const [picked, setPicked] = useState<Metric>('requests')
  const [active, setActive] = useState<number | null>(null)
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
  const format = (value: number) =>
    metric === 'spend' ? formatCost(value) : formatCompact(value)
  const peak = Math.max(0, ...series.map(valueOf))
  const ceiling = niceCeiling(peak)
  const step = Math.max(1, Math.ceil(series.length / MAX_LABELS))
  const rows = series.map((point) => ({
    ...point,
    label: bucketLabel(point.start, bucket),
    value: valueOf(point),
    detail: t(`${PREFIX}.overview.chartBar`, {
      time: bucketLabel(point.start, bucket, true),
      requests: formatCount(point.requests),
      errors: formatCount(point.errors),
    }),
  }))
  const current = active === null ? undefined : rows[active]
  const last = rows.length - 1

  const point = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    const ratio = (event.clientX - box.left) / box.width
    setActive(Math.min(last, Math.max(0, Math.floor(ratio * rows.length))))
  }
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
          <div className="flex gap-space-sm">
            <div
              aria-hidden="true"
              className="flex h-44 w-10 shrink-0 flex-col justify-between text-right text-xs text-fg-subtle tabular-nums"
            >
              <span className="-translate-y-1/2">{format(ceiling)}</span>
              <span>{format(ceiling / 2)}</span>
              <span className="translate-y-1/2">{format(0)}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div
                className="relative h-44 touch-none rounded-radius-sm has-focus-visible:ring-2 has-focus-visible:ring-line-focus"
                onPointerMove={point}
                onPointerLeave={() => setActive(null)}
              >
                {/* The keyboard's way through the buckets: a native slider, so arrows, Home and End work as anywhere else. */}
                {/* eslint-disable-next-line no-restricted-syntax -- Visually hidden range input: the shared Input and Slider both render visible chrome. */}
                <input
                  type="range"
                  className="sr-only"
                  aria-label={t(`${PREFIX}.overview.chartExplore`)}
                  aria-valuetext={(current ?? rows[last])?.detail}
                  min={0}
                  max={last}
                  step={1}
                  value={active ?? last}
                  onChange={(event) => setActive(Number(event.target.value))}
                  onFocus={() => setActive((value) => value ?? last)}
                  onBlur={() => setActive(null)}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') setActive(null)
                  }}
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 flex flex-col justify-between"
                >
                  <span className="border-t border-dashed border-line-subtle" />
                  <span className="border-t border-dashed border-line-subtle" />
                  <span className="border-t border-viz-axis" />
                </div>
                <div
                  aria-hidden="true"
                  className="absolute inset-0 flex items-end gap-0.5"
                >
                  {rows.map((row, index) => {
                    const errors = metric === 'requests' ? row.errors : 0
                    const ok = Math.max(0, row.value - errors)
                    return (
                      <div
                        key={row.start}
                        className={cn(
                          'flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-0.5 rounded-t-radius-sm transition-opacity',
                          index === active && 'bg-fill-hover',
                          active !== null && index !== active && 'opacity-50',
                        )}
                      >
                        {errors > 0 ? (
                          <div
                            className="min-h-0.5 w-full max-w-12 rounded-t-radius-sm bg-warning-fg"
                            style={{ height: `${(errors / ceiling) * 100}%` }}
                          />
                        ) : null}
                        {ok > 0 ? (
                          <div
                            className={cn(
                              'min-h-0.5 w-full max-w-12 bg-accent-solid',
                              errors === 0 && 'rounded-t-radius-sm',
                            )}
                            style={{ height: `${(ok / ceiling) * 100}%` }}
                          />
                        ) : null}
                      </div>
                    )
                  })}
                </div>
                {current && active !== null ? (
                  <div
                    data-testid="gateway-chart-tip"
                    className={cn(
                      'pointer-events-none absolute top-0 z-10 w-max min-w-44 rounded-radius-md border border-line bg-raised px-space-md py-space-sm text-xs shadow-elevation-medium',
                      active < rows.length / 2
                        ? 'translate-x-2'
                        : '-ml-2 -translate-x-full',
                    )}
                    style={{
                      left: `${((active + (active < rows.length / 2 ? 1 : 0)) / rows.length) * 100}%`,
                    }}
                  >
                    <div className="mb-space-xs font-medium text-fg">
                      {bucketLabel(current.start, bucket, true)}
                    </div>
                    <dl className="flex flex-col gap-space-xs">
                      <TipRow
                        strong
                        label={t(`${PREFIX}.overview.requests`)}
                        value={formatCount(current.requests)}
                      />
                      <TipRow
                        swatch="bg-accent-solid"
                        label={t(`${PREFIX}.overview.chartSuccess`)}
                        value={formatCount(current.requests - current.errors)}
                      />
                      <TipRow
                        swatch="bg-warning-fg"
                        label={t(`${PREFIX}.overview.chartFailed`)}
                        value={
                          current.requests > 0
                            ? `${formatCount(current.errors)} · ${formatPercent(current.errors / current.requests)}`
                            : formatCount(current.errors)
                        }
                      />
                      {current.total_tokens === undefined ? null : (
                        <TipRow
                          label={t(`${PREFIX}.overview.tokens`)}
                          value={formatCount(current.total_tokens)}
                        />
                      )}
                      {current.spend === undefined ? null : (
                        <TipRow
                          label={t(`${PREFIX}.overview.spend`)}
                          value={formatCost(current.spend)}
                        />
                      )}
                    </dl>
                  </div>
                ) : null}
              </div>
              <div aria-hidden="true" className="mt-space-xs flex gap-0.5">
                {rows.map((row, index) => (
                  <span
                    key={row.start}
                    className={cn(
                      'min-w-0 flex-1 overflow-visible text-center text-xs whitespace-nowrap',
                      index === active ? 'text-fg' : 'text-fg-subtle',
                    )}
                  >
                    {index % step === 0 || index === active ? row.label : ''}
                  </span>
                ))}
              </div>
            </div>
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
