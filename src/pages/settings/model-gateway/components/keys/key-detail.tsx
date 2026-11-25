import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { GatewayCatalog, GatewayKey } from '@/api/model-gateway'
import { ProviderLogo } from '@/components/patterns/provider-logo'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime, formatTimestamp } from '@/lib/utils'
import {
  callableModels,
  scopeGrants,
  scopeOfKey,
  staleGrants,
} from '../../catalog'
import { PREFIX, formatCount, formatInstant } from '../../utils'
import { StatusDot } from '../status-dot'
import { KeyUsage } from './key-usage'

const STATUS_TONE = {
  active: 'success',
  disabled: 'neutral',
  revoked: 'error',
} as const

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-space-sm">
      <h3 className="text-sm font-semibold text-fg">{title}</h3>
      {children}
    </section>
  )
}

/** The scope grouped by provider and connection, stale grants struck out. */
function KeyScope({
  gatewayKey,
  catalog,
}: {
  gatewayKey: GatewayKey
  catalog: GatewayCatalog
}) {
  const { t } = useTranslation()
  const scope = scopeOfKey(gatewayKey)
  if (scope.allModels)
    return (
      <div className="text-sm">
        <span className="font-medium text-fg">
          {t(`${PREFIX}.keys.scopeAll`)}
        </span>{' '}
        <span className="text-fg-subtle">
          {t(`${PREFIX}.keys.detail.modeAll`)} ·{' '}
          {t(`${PREFIX}.keys.detail.currentCount`, {
            count: callableModels(catalog, scope).length,
          })}
        </span>
      </div>
    )
  const grants = scopeGrants(catalog, scope)
  const stale = staleGrants(catalog, scope)
  if (grants.length === 0 && stale.count === 0)
    return (
      <p className="text-sm text-fg-subtle">{t(`${PREFIX}.keys.scopeNone`)}</p>
    )
  return (
    <ul className="flex flex-col gap-space-sm">
      {grants.flatMap((grant) =>
        grant.connections.map((connection) => (
          <li key={connection.instanceId} className="flex gap-space-sm text-sm">
            <ProviderLogo provider={grant.provider} size="sm" />
            <div className="min-w-0">
              <div>
                <span className="font-medium text-fg">
                  {grant.provider} · {connection.instanceName}
                </span>{' '}
                <span className="text-fg-subtle">
                  {t(
                    connection.whole
                      ? `${PREFIX}.keys.detail.modeWhole`
                      : `${PREFIX}.keys.detail.modePicked`,
                  )}
                </span>
              </div>
              <div className="font-mono text-xs break-all text-fg-muted">
                {connection.models.length === 0
                  ? t(`${PREFIX}.keys.detail.noCallable`)
                  : connection.models.map(({ model, stale: gone }, index) => (
                      <span key={model.model_id}>
                        {index > 0 ? ', ' : null}
                        {gone ? (
                          <del className="text-fg-subtle">
                            {t(`${PREFIX}.keys.detail.staleModel`, {
                              name: model.call_name,
                            })}
                          </del>
                        ) : (
                          model.call_name
                        )}
                      </span>
                    ))}
              </div>
            </div>
          </li>
        )),
      )}
      {stale.deletedInstanceIds.map((id) => (
        <li key={id}>
          <Badge tone="warning">
            {t(`${PREFIX}.keys.detail.deletedConnection`)}
          </Badge>
        </li>
      ))}
      {stale.deletedModelIds.length > 0 ? (
        <li>
          <Badge tone="warning">
            {t(`${PREFIX}.keys.detail.deletedModels`, {
              count: stale.deletedModelIds.length,
            })}
          </Badge>
        </li>
      ) : null}
    </ul>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-fg-subtle">{label}</dt>
      <dd className="min-w-0 break-words text-fg">{children}</dd>
    </>
  )
}

/** The Inspector body of one key: usage, scope, limits and details. */
export function KeyDetail({
  gatewayKey: key,
  catalog,
  onViewLogs,
}: {
  gatewayKey: GatewayKey
  catalog: GatewayCatalog
  onViewLogs: () => void
}) {
  const { t } = useTranslation()
  const unlimited = t(`${PREFIX}.limits.unlimited`)
  const limit = (value: number | null) =>
    value === null ? unlimited : formatCount(value)
  return (
    <div className="flex flex-col gap-space-lg">
      <StatusDot tone={STATUS_TONE[key.status]}>
        {t(`${PREFIX}.keyStatus.${key.status}`)}
      </StatusDot>
      <KeyUsage gatewayKey={key} onViewLogs={onViewLogs} />
      <Section title={t(`${PREFIX}.keys.detail.scopeTitle`)}>
        <KeyScope gatewayKey={key} catalog={catalog} />
      </Section>
      <Section title={t(`${PREFIX}.keys.detail.infoTitle`)}>
        <dl className="grid grid-cols-[auto_1fr] gap-x-space-lg gap-y-space-xs text-sm">
          <Field label={t(`${PREFIX}.keys.detail.rpm`)}>
            {limit(key.rpm_limit)}
          </Field>
          <Field label={t(`${PREFIX}.keys.detail.tpm`)}>
            {limit(key.tpm_limit)}
          </Field>
          <Field label={t(`${PREFIX}.keys.detail.parallel`)}>
            {limit(key.max_parallel_requests)}
          </Field>
          <Field label={t(`${PREFIX}.keys.detail.quota`)}>
            {key.token_quota !== null && key.quota_period !== null
              ? t(`${PREFIX}.keys.detail.quotaValue.${key.quota_period}`, {
                  value: formatCount(key.token_quota),
                })
              : t(`${PREFIX}.keys.noQuota`)}
          </Field>
          <Field label={t(`${PREFIX}.keys.detail.expiry`)}>
            {formatInstant(key.expires_at) ?? t(`${PREFIX}.keys.neverExpires`)}
          </Field>
          <Field label={t(`${PREFIX}.common.description`)}>
            {key.description || t(`${PREFIX}.common.empty`)}
          </Field>
          <Field label={t(`${PREFIX}.keys.detail.lastUsed`)}>
            {key.last_used_at
              ? formatRelativeTime(new Date(key.last_used_at).getTime())
              : t(`${PREFIX}.keys.neverUsed`)}
          </Field>
          {key.rotated_at ? (
            <Field label={t(`${PREFIX}.keys.detail.rotated`)}>
              {formatRelativeTime(new Date(key.rotated_at).getTime())}
              {key.previous_key_expires_at
                ? ` · ${t(`${PREFIX}.keys.detail.previousKeyUntil`, {
                    time: formatInstant(key.previous_key_expires_at) ?? '',
                  })}`
                : ''}
            </Field>
          ) : null}
          <Field label={t(`${PREFIX}.keys.detail.created`)}>
            {key.create_time
              ? formatTimestamp(key.create_time)
              : t(`${PREFIX}.common.empty`)}
          </Field>
        </dl>
      </Section>
    </div>
  )
}
