import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { GatewayKey } from '@/api/model-gateway'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useFetchGatewayUsage } from '@/hooks/use-model-gateway-request'
import { getCurrentLanguage } from '@/locales/i18n'
import { PREFIX, formatCompact, formatCount, quotaPercent } from '../../utils'
import { UsageBar } from '../usage-bar'
import { quotaText } from './key-row'

const DAYS = 14
const DAY = 86_400_000

/** The last 14 UTC days, oldest first, as "YYYY-MM-DD". */
function lastDays(now: number): string[] {
  const today = Date.UTC(
    new Date(now).getUTCFullYear(),
    new Date(now).getUTCMonth(),
    new Date(now).getUTCDate(),
  )
  return Array.from({ length: DAYS }, (_, index) =>
    new Date(today - (DAYS - 1 - index) * DAY).toISOString().slice(0, 10),
  )
}

const dayLabel = (day: string) =>
  new Intl.DateTimeFormat(getCurrentLanguage(), {
    month: 'numeric',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${day}T00:00:00Z`))

/** Quota use of the current period and tokens per day over two weeks. */
export function KeyUsage({
  gatewayKey: key,
  onViewLogs,
}: {
  gatewayKey: GatewayKey
  onViewLogs: () => void
}) {
  const { t } = useTranslation()
  // Fixed when the panel opens so the query key stays stable.
  const [days] = useState(() => lastDays(Date.now()))
  const usage = useFetchGatewayUsage({
    group_by: 'day',
    key_id: key.id,
    start: `${days[0]}T00:00:00.000Z`,
  })
  const byDay = new Map(
    (usage.data?.items ?? []).map((row) => [row.day ?? '', row.total_tokens]),
  )
  const values = days.map((day) => ({ day, value: byDay.get(day) ?? 0 }))
  const peak = Math.max(0, ...values.map((item) => item.value))
  const quota = quotaText(t, key)
  const percent = quotaPercent(key)
  const period = key.quota_period ?? 'none'

  return (
    <section
      aria-labelledby="gateway-key-usage"
      className="flex flex-col gap-space-sm"
    >
      <div className="flex items-baseline justify-between gap-space-sm text-sm">
        <h3 id="gateway-key-usage" className="font-semibold text-fg">
          {t(`${PREFIX}.keys.detail.usageTitle.${period}`)}
        </h3>
        <span className="text-fg-muted tabular-nums">
          {quota ?? t(`${PREFIX}.keys.noQuota`)}
        </span>
      </div>
      {percent !== null && quota ? (
        <UsageBar percent={percent} label={quota} size="md" />
      ) : null}
      {usage.isPending ? (
        <Skeleton className="h-14 w-full" />
      ) : peak === 0 ? (
        <p className="text-xs text-fg-subtle">
          {t(`${PREFIX}.keys.detail.sparklineEmpty`)}
        </p>
      ) : (
        <figure>
          <figcaption className="sr-only">
            {`${t(`${PREFIX}.keys.detail.sparkline`)}: ${values
              .map((item) =>
                t(`${PREFIX}.keys.detail.sparklineBar`, {
                  day: dayLabel(item.day),
                  value: formatCount(item.value),
                }),
              )
              .join('; ')}`}
          </figcaption>
          <div
            aria-hidden="true"
            className="flex h-14 items-end gap-0.5 border-b border-line-subtle"
          >
            {values.map((item) => (
              <div
                key={item.day}
                title={t(`${PREFIX}.keys.detail.sparklineBar`, {
                  day: dayLabel(item.day),
                  value: formatCompact(item.value),
                })}
                className="flex h-full min-w-0 flex-1 items-end"
              >
                <div
                  className="w-full rounded-t-radius-sm bg-accent-solid"
                  style={{
                    height: `${Math.max(item.value ? 4 : 0, (item.value / peak) * 100)}%`,
                  }}
                />
              </div>
            ))}
          </div>
        </figure>
      )}
      <Button
        variant="link"
        size="sm"
        className="self-start px-0"
        rightIcon={<ArrowRight className="size-icon-xs" aria-hidden="true" />}
        onClick={onViewLogs}
      >
        {t(`${PREFIX}.keys.detail.viewLogs`)}
      </Button>
    </section>
  )
}
