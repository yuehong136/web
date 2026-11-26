import { Check, Copy, MoreHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { GatewayCatalogModel } from '@/api/model-gateway'
import { ProviderLogo } from '@/components/patterns/provider-logo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { TableCell, TableRow } from '@/components/ui/table'
import { useCopyFeedback } from '@/hooks/use-copy-feedback'
import { useUpdateCatalogModel } from '@/hooks/use-model-gateway-request'
import { getMutationErrorNotice } from '@/lib/mutation-error-feedback'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { isCallable } from '../../catalog'
import { contextSummary, formatRate } from '../../pricing'
import { widestPool } from '../../routing'
import { PREFIX, formatCount, gatewayErrorKey, limitSummary } from '../../utils'
import { CapabilityChip, modelLogoProvider } from './model-identity'
import { ModelStatus } from './model-status'

/** The quiet second line under a call name: where it goes and how it is routed. */
function rowMeta(
  t: ReturnType<typeof useTranslation>['t'],
  model: GatewayCatalogModel,
): string | null {
  const parts: string[] = []
  // Only worth a line when callers use another name than the upstream's.
  if (model.model_name !== model.call_name)
    parts.push(t(`${PREFIX}.models.upstreamName`, { name: model.model_name }))
  if (model.pools?.length) {
    const weight = model.weight ?? 1
    parts.push(
      model.order === null || model.order === undefined
        ? t(`${PREFIX}.models.orderUnset`)
        : t(`${PREFIX}.models.orderValue`, { value: model.order }),
    )
    if (weight !== 1)
      parts.push(t(`${PREFIX}.models.weightValue`, { value: weight }))
  }
  return parts.length > 0 ? parts.join(' · ') : null
}

export function ModelRow({
  model,
  peakRequests,
  onEdit,
}: {
  model: GatewayCatalogModel
  /** The busiest model of the connection, the full width of the usage bar. */
  peakRequests: number
  onEdit: () => void
}) {
  const { t } = useTranslation()
  const mutation = useUpdateCatalogModel()
  const { copiedStates, copyWithFeedback } = useCopyFeedback()
  const copied = Boolean(copiedStates.name)
  const callable = isCallable(model)
  const unavailable = model.state === 'unavailable'
  const meta = rowMeta(t, model)
  const pricing = model.pricing
  const context = contextSummary(t, model)
  const pool = widestPool(model)
  const limits = limitSummary(t, model)
  const share =
    peakRequests > 0 ? Math.max(model.requests_7d / peakRequests, 0) : 0

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
    <TableRow className="group">
      <TableCell className="py-space-sm">
        <div className="flex items-center gap-space-sm">
          <ProviderLogo
            provider={modelLogoProvider(model)}
            size="sm"
            className={cn(!callable && 'opacity-50 grayscale')}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-space-xs">
              <span
                className={cn(
                  'truncate font-mono text-sm',
                  callable ? 'text-fg' : 'text-fg-subtle',
                )}
                title={model.call_name}
              >
                {model.call_name}
              </span>
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
              {model.alias ? (
                <Badge>{t(`${PREFIX}.models.alias`)}</Badge>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className={cn(
                  'size-6 min-h-0 shrink-0 text-fg-subtle',
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
            </div>
            {meta ? (
              <p
                className="truncate text-xs text-fg-subtle"
                title={model.model_name}
              >
                {meta}
              </p>
            ) : null}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <ModelStatus model={model} />
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-space-xs">
          {model.model_types.map((type) => (
            <CapabilityChip key={type} type={type} />
          ))}
        </div>
      </TableCell>
      <TableCell className="text-sm whitespace-nowrap">
        {pricing ? (
          <div
            title={t(
              pricing.tiered
                ? `${PREFIX}.models.priceHintTiered`
                : `${PREFIX}.models.priceHint`,
            )}
          >
            <div className="flex items-baseline gap-space-xs tabular-nums">
              <span className="text-fg">
                {formatRate(pricing.input_cost_per_token)}
              </span>
              <span className="text-fg-subtle" aria-hidden="true">
                /
              </span>
              <span className="text-fg">
                {formatRate(pricing.output_cost_per_token)}
              </span>
              {pricing.source === 'custom' ? (
                <Badge>{t(`${PREFIX}.models.customPrice`)}</Badge>
              ) : null}
            </div>
            {context ? (
              <div className="text-xs text-fg-subtle">{context}</div>
            ) : null}
          </div>
        ) : (
          <span className="text-fg-subtle">
            {context ?? t(`${PREFIX}.common.empty`)}
          </span>
        )}
      </TableCell>
      <TableCell className="text-sm text-fg-muted">
        {limits ?? (
          <span className="text-fg-subtle">{t(`${PREFIX}.common.empty`)}</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-space-sm">
          {/* The bar is the picture of the number beside it, nothing more. */}
          <span
            aria-hidden="true"
            className="h-1 w-12 overflow-hidden rounded-radius-full bg-fill-pressed"
          >
            <span
              className="block h-full rounded-radius-full bg-accent-solid"
              style={{ width: `${share * 100}%` }}
            />
          </span>
          <span
            className={cn(
              'min-w-8 text-right text-sm tabular-nums',
              model.requests_7d > 0 ? 'text-fg' : 'text-fg-subtle',
            )}
          >
            {formatCount(model.requests_7d)}
          </span>
        </div>
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
