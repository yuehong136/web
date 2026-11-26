import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { GatewayKey, GatewayOverview } from '@/api/model-gateway'
import { SectionCard } from '@/components/patterns'
import { ProviderLogo } from '@/components/patterns/provider-logo'
import { Button } from '@/components/ui/button'
import { formatCost } from '../../pricing'
import { PREFIX, formatCompact, formatPercent, quotaPercent } from '../../utils'
import { UsageBar } from '../usage-bar'

function TopList({
  title,
  viewAll,
  onViewAll,
  empty,
  children,
}: {
  title: string
  viewAll: string
  onViewAll: () => void
  empty: boolean
  children: ReactNode
}) {
  const { t } = useTranslation()
  return (
    <SectionCard
      padding="none"
      title={title}
      actions={
        <Button variant="link" size="sm" className="px-0" onClick={onViewAll}>
          {viewAll}
        </Button>
      }
    >
      {empty ? (
        <p className="px-space-lg py-space-xl text-center text-sm text-fg-subtle">
          {t(`${PREFIX}.overview.topEmpty`)}
        </p>
      ) : (
        <ul className="divide-y divide-line-subtle">{children}</ul>
      )}
    </SectionCard>
  )
}

/** The busiest models of the window by tokens. */
export function TopModels({
  overview,
  onViewAll,
}: {
  overview: GatewayOverview
  onViewAll: () => void
}) {
  const { t } = useTranslation()
  const top = overview.top_models[0]?.total_tokens ?? 0
  const all = overview.totals.total_tokens
  return (
    <TopList
      title={t(`${PREFIX}.overview.topModels`)}
      viewAll={t(`${PREFIX}.overview.allModels`)}
      onViewAll={onViewAll}
      empty={overview.top_models.length === 0}
    >
      {overview.top_models.map((model) => (
        <li
          key={model.model_id}
          className="flex items-center gap-space-md px-space-lg py-space-sm transition-colors hover:bg-fill-hover"
        >
          <ProviderLogo provider={model.provider} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="truncate font-mono text-sm text-fg">
              {model.name}
            </div>
            <div className="mt-space-xs h-1.5 overflow-hidden rounded-radius-full bg-fill-pressed">
              <div
                className="h-full rounded-radius-full bg-accent-solid"
                style={{
                  width: `${top ? (model.total_tokens / top) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
          <div className="w-40 shrink-0 text-right">
            <div className="text-sm text-fg tabular-nums">
              {formatCompact(model.total_tokens)}
            </div>
            <div className="text-xs text-fg-subtle tabular-nums">
              {[
                t(`${PREFIX}.overview.requestsCount`, {
                  count: model.requests,
                }),
                all > 0
                  ? t(`${PREFIX}.overview.topShare`, {
                      share: formatPercent(model.total_tokens / all, 0),
                    })
                  : null,
                model.spend ? formatCost(model.spend) : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </div>
          </div>
        </li>
      ))}
    </TopList>
  )
}

/** The busiest keys of the window, with their quota where they have one. */
export function TopKeys({
  overview,
  keys,
  onViewAll,
}: {
  overview: GatewayOverview
  keys: GatewayKey[]
  onViewAll: () => void
}) {
  const { t } = useTranslation()
  const byId = new Map(keys.map((key) => [key.id, key]))
  return (
    <TopList
      title={t(`${PREFIX}.overview.topKeys`)}
      viewAll={t(`${PREFIX}.overview.allKeys`)}
      onViewAll={onViewAll}
      empty={overview.top_keys.length === 0}
    >
      {overview.top_keys.map((item) => {
        const key = byId.get(item.key_id)
        const percent = key ? quotaPercent(key) : null
        const quota =
          key && key.token_quota !== null && key.quota_period !== null
            ? t(`${PREFIX}.quota.usage.${key.quota_period}`, {
                used: formatCompact(key.quota_used ?? 0),
                quota: formatCompact(key.token_quota),
              })
            : t(`${PREFIX}.keys.noQuota`)
        return (
          <li
            key={item.key_id}
            className="flex items-center gap-space-md px-space-lg py-space-sm"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-fg">
                {item.key_name}
              </div>
              <div className="text-xs text-fg-subtle">{quota}</div>
            </div>
            <div className="w-32 shrink-0">
              {percent !== null ? (
                <UsageBar percent={percent} label={quota} />
              ) : null}
            </div>
            <div className="w-20 shrink-0 text-right">
              <div className="text-sm text-fg tabular-nums">
                {formatCompact(item.total_tokens)}
              </div>
              {item.spend ? (
                <div className="text-xs text-fg-subtle tabular-nums">
                  {formatCost(item.spend)}
                </div>
              ) : null}
            </div>
          </li>
        )
      })}
    </TopList>
  )
}
