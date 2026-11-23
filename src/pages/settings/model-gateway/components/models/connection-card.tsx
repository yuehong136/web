import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { GatewayCatalogModel } from '@/api/model-gateway'
import { SectionCard } from '@/components/patterns'
import { ProviderLogo } from '@/components/patterns/provider-logo'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useUpdateCatalogInstance } from '@/hooks/use-model-gateway-request'
import { getMutationErrorNotice } from '@/lib/mutation-error-feedback'
import { toast } from '@/lib/toast'
import { isCallable, type ConnectionGroup } from '../../catalog'
import { PREFIX, gatewayErrorKey } from '../../utils'
import { ModelRow } from './model-row'

interface ConnectionCardProps {
  /** The connection with the models that pass the filters. */
  connection: ConnectionGroup
  /** Every model of the connection, for the "open all" switch. */
  allModels: GatewayCatalogModel[]
  onEdit: (model: GatewayCatalogModel) => void
}

/** One provider connection: its name prefix, open-all switch and models. */
export function ConnectionCard({
  connection,
  allModels,
  onEdit,
}: ConnectionCardProps) {
  const { t } = useTranslation()
  const mutation = useUpdateCatalogInstance()
  const openable = allModels.filter((model) => model.reason === null)
  const allOpen =
    openable.length > 0 && openable.every((model) => model.enabled)
  const label = `${connection.provider} · ${connection.instance_name}`
  const prefix = `${connection.provider}/`

  const toggleAll = async (enabled: boolean) => {
    try {
      await mutation.mutateAsync({
        instanceId: connection.instance_id,
        enabled,
      })
      toast.success(
        t(enabled ? `${PREFIX}.messages.opened` : `${PREFIX}.messages.closed`),
      )
    } catch (error) {
      if (getMutationErrorNotice(error))
        toast.error(t(gatewayErrorKey(error, 'catalog')))
    }
  }

  return (
    <SectionCard padding="none" aria-label={label}>
      <div className="flex flex-wrap items-center gap-space-md px-space-lg py-space-md">
        <ProviderLogo provider={connection.provider} size="md" />
        <div className="min-w-0 flex-[1_1_16rem]">
          <div className="flex flex-wrap items-center gap-space-xs">
            <h3 className="text-sm font-semibold text-fg">
              {connection.provider}
            </h3>
            <Badge>
              {t(`${PREFIX}.models.connection`, {
                name: connection.instance_name,
              })}
            </Badge>
            <Badge
              variant="outline"
              className="font-mono"
              title={t(`${PREFIX}.models.prefixHint`, { prefix })}
            >
              {prefix}
            </Badge>
          </div>
          <p className="mt-space-2xs text-xs text-fg-subtle">
            {t(`${PREFIX}.models.countOpen`, {
              open: allModels.filter(isCallable).length,
              total: allModels.length,
            })}
          </p>
        </div>
        <Link
          to={`/settings/model-providers?tab=providers&provider=${encodeURIComponent(connection.provider)}`}
          className="text-sm text-accent-fg hover:underline focus-visible:ring-2 focus-visible:ring-line-focus focus-visible:outline-hidden"
        >
          {t(`${PREFIX}.models.manage`)}
        </Link>
        <div className="flex items-center gap-space-sm">
          <span className="text-sm text-fg-muted" aria-hidden="true">
            {t(`${PREFIX}.models.openAll`)}
          </span>
          <Switch
            size="sm"
            checked={allOpen}
            disabled={openable.length === 0 || mutation.isPending}
            aria-label={t(`${PREFIX}.models.openAllLabel`, { name: label })}
            onCheckedChange={(checked) => void toggleAll(checked)}
          />
        </div>
      </div>
      <Table wrapperClassName="border-t border-line-subtle">
        <TableHeader className="bg-sunken">
          <TableRow>
            <TableHead>{t(`${PREFIX}.models.columns.callName`)}</TableHead>
            <TableHead>{t(`${PREFIX}.models.columns.capabilities`)}</TableHead>
            <TableHead>{t(`${PREFIX}.models.columns.upstream`)}</TableHead>
            <TableHead>{t(`${PREFIX}.models.columns.limits`)}</TableHead>
            <TableHead className="text-right">
              {t(`${PREFIX}.models.columns.requests7d`)}
            </TableHead>
            <TableHead className="text-right">
              {t(`${PREFIX}.models.columns.open`)}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {connection.models.map((model) => (
            <ModelRow
              key={model.model_id}
              model={model}
              onEdit={() => onEdit(model)}
            />
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  )
}
