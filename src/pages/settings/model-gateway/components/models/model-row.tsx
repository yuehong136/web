import { MoreHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { GatewayCatalogModel } from '@/api/model-gateway'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { TableCell, TableRow } from '@/components/ui/table'
import { useUpdateCatalogModel } from '@/hooks/use-model-gateway-request'
import { getMutationErrorNotice } from '@/lib/mutation-error-feedback'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { isCallable } from '../../catalog'
import {
  PREFIX,
  capabilityLabel,
  formatCount,
  gatewayErrorKey,
  limitSummary,
  modelStateLabel,
} from '../../utils'

/** A note under the call name: who owns a shared name, or why it is off. */
function rowNote(
  t: ReturnType<typeof useTranslation>['t'],
  model: GatewayCatalogModel,
) {
  if (model.state === 'unavailable') return modelStateLabel(t, model)
  if (!model.shares_name) return null
  return model.names.includes(model.model_name)
    ? t(`${PREFIX}.models.preferred`)
    : t(`${PREFIX}.models.notPreferred`)
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
  const callable = isCallable(model)
  const unavailable = model.state === 'unavailable'
  const note = rowNote(t, model)

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
    <TableRow className={cn(!callable && 'text-fg-subtle')}>
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
          {model.shares_name ? (
            <Badge
              variant="warning"
              title={t(`${PREFIX}.models.sharesNameHint`)}
            >
              {t(`${PREFIX}.models.sharesName`)}
            </Badge>
          ) : null}
          {model.alias ? (
            <Badge variant="secondary">{t(`${PREFIX}.models.alias`)}</Badge>
          ) : null}
        </div>
        {note ? (
          <p className="mt-space-2xs text-xs text-fg-subtle">{note}</p>
        ) : null}
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-space-xs">
          {model.model_types.map((type) => (
            <Badge key={type} variant="secondary">
              {capabilityLabel(t, type)}
            </Badge>
          ))}
        </div>
      </TableCell>
      <TableCell className="max-w-48 truncate font-mono text-xs text-fg-muted">
        <span title={model.model_name}>{model.model_name}</span>
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
