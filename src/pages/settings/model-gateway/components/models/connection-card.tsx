import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { GatewayCatalogModel } from '@/api/model-gateway'
import { SectionCard } from '@/components/patterns'
import { ProviderLogo } from '@/components/patterns/provider-logo'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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
import { cn } from '@/lib/utils'
import { isCallable, type ConnectionGroup } from '../../catalog'
import {
  PREFIX,
  capabilityLabel,
  formatCount,
  gatewayErrorKey,
} from '../../utils'
import { CapabilityChip } from './model-identity'
import { ModelRow } from './model-row'
import { StatusLight, type StatusTone } from './model-status'

/** The gateway has no endpoint for these; no switch can change that. */
const unsupported = (model: GatewayCatalogModel) =>
  model.reason === 'endpoint_not_supported' ||
  model.reason === 'provider_not_supported'

const HEALTH_TONES = [
  ['healthy', 'success'],
  ['rate_limited', 'warning'],
  ['unhealthy', 'danger'],
] as const satisfies readonly (readonly [string, StatusTone])[]

const BAR: Record<StatusTone, string> = {
  success: 'bg-success-fg',
  warning: 'bg-warning-fg',
  danger: 'bg-danger-fg',
  neutral: 'bg-fill-pressed',
}

/**
 * The health of a connection at a glance: one segment per checked model, then
 * the counts in words. Nothing is shown until a health check has run.
 */
function HealthSummary({ models }: { models: GatewayCatalogModel[] }) {
  const { t } = useTranslation()
  const checked = models.filter((model) => isCallable(model) && model.health)
  if (checked.length === 0) return null
  const counts = HEALTH_TONES.map(([status, tone]) => ({
    status,
    tone,
    count: checked.filter((model) => model.health?.status === status).length,
  })).filter((item) => item.count > 0)
  return (
    <span className="flex flex-wrap items-center gap-x-space-md gap-y-space-2xs">
      <span
        aria-hidden="true"
        className="flex h-1.5 w-24 gap-px overflow-hidden rounded-radius-full"
      >
        {counts.map((item) => (
          <span
            key={item.status}
            className={BAR[item.tone]}
            style={{ flexGrow: item.count }}
          />
        ))}
      </span>
      {counts.map((item) => (
        <span
          key={item.status}
          className="inline-flex items-center gap-space-2xs text-xs text-fg-muted"
        >
          <StatusLight tone={item.tone} />
          {t(`${PREFIX}.models.healthCount.${item.status}`, {
            count: item.count,
          })}
        </span>
      ))}
    </span>
  )
}

interface ConnectionCardProps {
  /** The connection with the models that pass the filters. */
  connection: ConnectionGroup
  /** Every model of the connection, for the "open all" switch. */
  allModels: GatewayCatalogModel[]
  /** Whether the model table is shown under the header. */
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (model: GatewayCatalogModel) => void
}

/**
 * One provider connection: its name prefix, open-all switch and models. The
 * header stays when the card is collapsed and carries the counts.
 */
export function ConnectionCard({
  connection,
  allModels,
  open,
  onOpenChange,
  onEdit,
}: ConnectionCardProps) {
  const { t } = useTranslation()
  const mutation = useUpdateCatalogInstance()
  const [showUnsupported, setShowUnsupported] = useState(false)
  const rows = connection.models.filter((model) => !unsupported(model))
  const others = connection.models.filter(unsupported)
  const peakRequests = Math.max(0, ...rows.map((model) => model.requests_7d))
  // "Rerank 2 · Vision 1": what the gateway cannot serve yet, by capability.
  const otherKinds = [...new Set(others.flatMap((model) => model.model_types))]
    .map(
      (type) =>
        `${capabilityLabel(t, type)} ${others.filter((model) => model.model_types.includes(type)).length}`,
    )
    .join(' · ')
  const openable = allModels.filter((model) => model.reason === null)
  const allOpen =
    openable.length > 0 && openable.every((model) => model.enabled)
  const label = `${connection.provider} · ${connection.instance_name}`
  const prefix = `${connection.provider}/`
  const requests = allModels.reduce((sum, model) => sum + model.requests_7d, 0)
  const summary = [
    t(`${PREFIX}.models.countOpen`, {
      open: allModels.filter(isCallable).length,
      total: allModels.length,
    }),
    requests > 0
      ? t(`${PREFIX}.models.requests7d`, { value: formatCount(requests) })
      : null,
    connection.models.length < allModels.length
      ? t(`${PREFIX}.models.countMatching`, {
          count: connection.models.length,
        })
      : null,
  ]
    .filter(Boolean)
    .join(' · ')

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
      <Collapsible open={open} onOpenChange={onOpenChange}>
        <div className="flex flex-wrap items-center gap-space-md px-space-lg py-space-md">
          <h3 className="flex min-w-0 flex-[1_1_16rem]">
            <CollapsibleTrigger className="-m-space-xs flex min-w-0 flex-1 items-center gap-space-md rounded-radius-md p-space-xs text-left outline-hidden hover:bg-fill-hover focus-visible:ring-2 focus-visible:ring-line-focus">
              <ChevronRight
                className={cn(
                  'size-icon-sm shrink-0 text-fg-muted transition-transform motion-reduce:transition-none',
                  open && 'rotate-90',
                )}
                aria-hidden="true"
              />
              <ProviderLogo provider={connection.provider} size="md" />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-space-xs">
                  <span className="text-sm font-semibold text-fg">
                    {connection.provider}
                  </span>
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
                </span>
                <span className="mt-space-2xs flex flex-wrap items-center gap-x-space-md gap-y-space-2xs text-xs font-normal text-fg-subtle">
                  <span>{summary}</span>
                  <HealthSummary models={allModels} />
                </span>
              </span>
            </CollapsibleTrigger>
          </h3>
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
        <CollapsibleContent>
          {rows.length > 0 ? (
            <Table
              wrapperClassName="border-t border-line-subtle"
              // Fixed columns, so every connection's table lines up with the next.
              className="min-w-[56rem] table-fixed"
            >
              <TableHeader className="bg-sunken">
                <TableRow>
                  <TableHead>{t(`${PREFIX}.models.columns.model`)}</TableHead>
                  <TableHead className="w-32">
                    {t(`${PREFIX}.models.columns.status`)}
                  </TableHead>
                  <TableHead className="w-24">
                    {t(`${PREFIX}.models.columns.capabilities`)}
                  </TableHead>
                  <TableHead className="w-40">
                    {t(`${PREFIX}.models.columns.price`)}
                  </TableHead>
                  <TableHead className="w-28">
                    {t(`${PREFIX}.models.columns.limits`)}
                  </TableHead>
                  <TableHead className="w-32 text-right">
                    {t(`${PREFIX}.models.columns.requests7d`)}
                  </TableHead>
                  <TableHead className="w-24 text-right">
                    {t(`${PREFIX}.models.columns.open`)}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((model) => (
                  <ModelRow
                    key={model.model_id}
                    model={model}
                    peakRequests={peakRequests}
                    onEdit={() => onEdit(model)}
                  />
                ))}
              </TableBody>
            </Table>
          ) : null}
          {others.length > 0 ? (
            <Collapsible
              open={showUnsupported}
              onOpenChange={setShowUnsupported}
              className="border-t border-line-subtle"
            >
              <CollapsibleTrigger className="flex w-full items-center gap-space-sm px-space-lg py-space-sm text-left text-xs text-fg-muted outline-hidden hover:bg-fill-hover focus-visible:ring-2 focus-visible:ring-line-focus">
                <ChevronRight
                  className={cn(
                    'size-icon-xs shrink-0 transition-transform motion-reduce:transition-none',
                    showUnsupported && 'rotate-90',
                  )}
                  aria-hidden="true"
                />
                <span>
                  {t(`${PREFIX}.models.unsupportedModels`, {
                    count: others.length,
                  })}
                </span>
                <span className="text-fg-subtle">{otherKinds}</span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ul className="flex flex-wrap gap-space-xs px-space-lg pb-space-md">
                  {others.map((model) => (
                    <li
                      key={model.model_id}
                      className="flex items-center gap-space-xs rounded-radius-md border border-line-subtle py-space-2xs pr-space-xs pl-space-sm"
                    >
                      <span className="font-mono text-xs text-fg-muted">
                        {model.model_name}
                      </span>
                      {model.model_types.map((type) => (
                        <CapabilityChip key={type} type={type} />
                      ))}
                    </li>
                  ))}
                </ul>
              </CollapsibleContent>
            </Collapsible>
          ) : null}
        </CollapsibleContent>
      </Collapsible>
    </SectionCard>
  )
}
