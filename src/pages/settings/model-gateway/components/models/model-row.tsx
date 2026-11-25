import { Check, Copy, MoreHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type {
  GatewayCatalogModel,
  GatewayModelHealth,
} from '@/api/model-gateway'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { TableCell, TableRow } from '@/components/ui/table'
import { useCopyFeedback } from '@/hooks/use-copy-feedback'
import { useUpdateCatalogModel } from '@/hooks/use-model-gateway-request'
import { getMutationErrorNotice } from '@/lib/mutation-error-feedback'
import { toast } from '@/lib/toast'
import { cn, formatRelativeTime } from '@/lib/utils'
import { isCallable } from '../../catalog'
import { contextSummary, priceSummary } from '../../pricing'
import { widestPool } from '../../routing'
import {
  PREFIX,
  capabilityLabel,
  formatCount,
  formatDuration,
  gatewayErrorKey,
  limitSummary,
  modelStateLabel,
} from '../../utils'

const FAILURE_CLASSES = [
  'rate_limit',
  'credential',
  'quota',
  'model_gone',
  'transient',
  'timeout',
  'unreachable',
] as const

/** "Healthy · 420 ms · checked 3 minutes ago", or what is wrong and what to do. */
export function healthLabel(
  t: ReturnType<typeof useTranslation>['t'],
  health: GatewayModelHealth,
): string {
  const checked = health.checked_at
    ? formatRelativeTime(new Date(health.checked_at).getTime())
    : ''
  if (health.status === 'healthy')
    return health.source === 'traffic'
      ? t(`${PREFIX}.models.health.healthyTraffic`, { checked })
      : t(`${PREFIX}.models.health.healthy`, {
          duration: formatDuration(health.response_time_ms),
          checked,
        })
  const known = FAILURE_CLASSES.find((item) => item === health.failure_class)
  // Servers before failure classes only said which status came back.
  const reason =
    known ??
    (health.status === 'rate_limited'
      ? 'rate_limit'
      : health.status_code === null
        ? 'unreachable'
        : 'transient')
  return t(`${PREFIX}.models.health.reasons.${reason}`, {
    status: health.status_code ?? '',
    checked,
  })
}

const HEALTH_DOT: Record<string, string> = {
  healthy: 'bg-success-fg',
  rate_limited: 'bg-warning-fg',
}

/** A note under the call name: why the model is off, or how it is routed. */
function rowNote(
  t: ReturnType<typeof useTranslation>['t'],
  model: GatewayCatalogModel,
) {
  if (model.state === 'unavailable') return modelStateLabel(t, model)
  if (!model.pools?.length) return null
  const weight = model.weight ?? 1
  return [
    model.order === null || model.order === undefined
      ? t(`${PREFIX}.models.orderUnset`)
      : t(`${PREFIX}.models.orderValue`, { value: model.order }),
    weight === 1 ? null : t(`${PREFIX}.models.weightValue`, { value: weight }),
  ]
    .filter(Boolean)
    .join(' · ')
}

export function ModelRow({
  model,
  onEdit,
}: {
  model: GatewayCatalogModel
  onEdit: () => void
}) {
  const { t } = useTranslation()
  const mutation = useUpdateCatalogModel()
  const { copiedStates, copyWithFeedback } = useCopyFeedback()
  const copied = Boolean(copiedStates.name)
  const callable = isCallable(model)
  const unavailable = model.state === 'unavailable'
  const note = rowNote(t, model)
  const price = priceSummary(model.pricing)
  const context = contextSummary(t, model)
  const pool = widestPool(model)

  const toggle = async (enabled: boolean) => {
    try {
      await mutation.mutateAsync({
        modelId: model.model_id,
        input: { enabled },
      })
    } catch (error) {
      if (getMutationErrorNotice(error))
        toast.error(t(gatewayErrorKey(error, 'model')))
    }
  }

  return (
    <TableRow className={cn('group', !callable && 'text-fg-subtle')}>
      <TableCell className="max-w-72 py-space-sm">
        <div className="flex flex-wrap items-center gap-space-xs">
          <span
            className={cn(
              'font-mono text-sm break-all',
              callable ? 'text-fg' : 'text-fg-subtle',
            )}
          >
            {model.call_name}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={cn(
              'size-6 min-h-0 text-fg-subtle',
              !copied &&
                'opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100',
            )}
            aria-label={t(`${PREFIX}.models.settings.copyName`, {
              name: model.call_name,
            })}
            onClick={() => void copyWithFeedback(model.call_name, 'name')}
          >
            {copied ? (
              <Check className="size-icon-xs" aria-hidden="true" />
            ) : (
              <Copy className="size-icon-xs" aria-hidden="true" />
            )}
          </Button>
          {pool ? (
            <Badge
              tone="info"
              title={t(`${PREFIX}.models.pooledHint`, {
                name: pool.name,
                count: pool.deployments,
              })}
            >
              {t(`${PREFIX}.models.pooled`, { count: pool.deployments })}
            </Badge>
          ) : null}
          {model.alias ? <Badge>{t(`${PREFIX}.models.alias`)}</Badge> : null}
          {model.health && callable ? (
            <span
              title={healthLabel(t, model.health)}
              className={cn(
                'size-2 shrink-0 rounded-radius-full',
                HEALTH_DOT[model.health.status] ?? 'bg-danger-fg',
              )}
            >
              <span className="sr-only">{healthLabel(t, model.health)}</span>
            </span>
          ) : null}
        </div>
        {note ? (
          <p className="mt-space-2xs text-xs text-fg-subtle">{note}</p>
        ) : null}
        {callable && model.health && model.health.status !== 'healthy' ? (
          <p
            className={cn(
              'mt-space-2xs text-xs',
              model.health.status === 'rate_limited'
                ? 'text-warning-fg'
                : 'text-danger-fg',
            )}
          >
            {healthLabel(t, model.health)}
          </p>
        ) : null}
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-space-xs">
          {model.model_types.map((type) => (
            <Badge key={type}>{capabilityLabel(t, type)}</Badge>
          ))}
        </div>
      </TableCell>
      <TableCell className="max-w-48 truncate font-mono text-xs text-fg-muted">
        <span title={model.model_name}>{model.model_name}</span>
      </TableCell>
      <TableCell className="text-sm whitespace-nowrap text-fg-muted">
        {price ? (
          <div
            className="flex items-center gap-space-xs tabular-nums"
            title={t(
              model.pricing?.tiered
                ? `${PREFIX}.models.priceHintTiered`
                : `${PREFIX}.models.priceHint`,
            )}
          >
            {price}
            {model.pricing?.source === 'custom' ? (
              <Badge>{t(`${PREFIX}.models.customPrice`)}</Badge>
            ) : null}
          </div>
        ) : (
          t(`${PREFIX}.common.empty`)
        )}
        {context ? (
          <div className="text-xs text-fg-subtle">{context}</div>
        ) : null}
      </TableCell>
      <TableCell className="text-sm text-fg-muted">
        {limitSummary(t, model) ?? t(`${PREFIX}.common.empty`)}
      </TableCell>
      <TableCell className="text-right text-sm text-fg-muted tabular-nums">
        {formatCount(model.requests_7d)}
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-space-xs">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t(`${PREFIX}.models.moreLabel`, {
              name: model.call_name,
            })}
            onClick={onEdit}
          >
            <MoreHorizontal className="size-icon-sm" aria-hidden="true" />
          </Button>
          <Switch
            size="sm"
            checked={callable}
            disabled={unavailable || mutation.isPending}
            aria-label={t(`${PREFIX}.models.openLabel`, {
              name: model.call_name,
            })}
            onCheckedChange={(checked) => void toggle(checked)}
          />
        </div>
      </TableCell>
    </TableRow>
  )
}
