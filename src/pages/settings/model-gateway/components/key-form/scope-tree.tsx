import { useState } from 'react'
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { GatewayCatalog, GatewayCatalogModel } from '@/api/model-gateway'
import { ProviderLogo } from '@/components/patterns/provider-logo'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { cn } from '@/lib/utils'
import {
  connectionCheck,
  groupCatalog,
  isCallable,
  modelChecked,
  toggleConnection,
  toggleModel,
  type ConnectionGroup,
  type KeyScope,
} from '../../catalog'
import { PREFIX, capabilityLabel, modelStateLabel } from '../../utils'

type Capability = 'all' | 'chat' | 'embedding'

interface ScopeTreeProps {
  catalog: GatewayCatalog
  scope: KeyScope
  disabled?: boolean
  onChange: (scope: KeyScope) => void
}

/**
 * Connections with a tri-state checkbox (checked: the whole connection,
 * including models opened later; mixed: some models) and their models.
 */
export function ScopeTree({
  catalog,
  scope,
  disabled,
  onChange,
}: ScopeTreeProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [capability, setCapability] = useState<Capability>('all')
  const query = search.trim().toLowerCase()
  const groups = groupCatalog(
    catalog,
    (model) =>
      (capability === 'all' || model.model_types.includes(capability)) &&
      (!query ||
        model.provider.toLowerCase().includes(query) ||
        model.instance_name.toLowerCase().includes(query) ||
        model.names.some((name) => name.toLowerCase().includes(query))),
  )

  return (
    <div className="overflow-hidden rounded-radius-lg border border-line-subtle">
      <div className="flex flex-wrap items-center gap-space-sm border-b border-line-subtle p-space-sm">
        <div className="min-w-48 flex-1">
          <Input
            type="search"
            inputSize="sm"
            aria-label={t(`${PREFIX}.keyForm.searchModels`)}
            placeholder={t(`${PREFIX}.keyForm.searchModels`)}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            leftIcon={<Search className="size-icon-sm" aria-hidden="true" />}
          />
        </div>
        <SegmentedControl
          size="sm"
          aria-label={t(`${PREFIX}.capabilityFilter.label`)}
          value={capability}
          onValueChange={setCapability}
          options={[
            {
              value: 'all',
              label: t(`${PREFIX}.capabilityFilter.allCapabilities`),
            },
            { value: 'chat', label: t(`${PREFIX}.capabilities.chat`) },
            {
              value: 'embedding',
              label: t(`${PREFIX}.capabilities.embedding`),
            },
          ]}
        />
      </div>
      <div className="max-h-96 overflow-y-auto">
        {groups.length === 0 ? (
          <p className="p-space-lg text-center text-sm text-fg-subtle">
            {t(`${PREFIX}.keyForm.noModels`)}
          </p>
        ) : (
          groups.flatMap((group) =>
            group.connections.map((connection) => (
              <ConnectionNode
                key={connection.instance_id}
                connection={connection}
                allModels={catalog.models.filter(
                  (model) => model.instance_id === connection.instance_id,
                )}
                scope={scope}
                disabled={disabled}
                onChange={onChange}
              />
            )),
          )
        )}
      </div>
    </div>
  )
}

function ConnectionNode({
  connection,
  allModels,
  scope,
  disabled,
  onChange,
}: {
  connection: ConnectionGroup
  allModels: GatewayCatalogModel[]
  scope: KeyScope
  disabled?: boolean
  onChange: (scope: KeyScope) => void
}) {
  const { t } = useTranslation()
  const state = connectionCheck(scope, connection)
  const name = `${connection.provider} · ${connection.instance_name}`
  const open = allModels.filter(isCallable)
  const picked = open.filter((model) => scope.modelIds.includes(model.model_id))
  const notRelayed = allModels.every(
    (model) => model.reason === 'provider_not_supported',
  )
  // Toggling acts on every model of the connection, not just the shown ones.
  const whole = { ...connection, models: allModels }
  return (
    <div className="border-b border-line-subtle last:border-b-0">
      <div className="flex items-center gap-space-sm bg-sunken px-space-md py-space-sm">
        <Checkbox
          checked={state === 'checked'}
          indeterminate={state === 'mixed'}
          disabled={disabled || (notRelayed && state === 'unchecked')}
          aria-label={t(`${PREFIX}.keyForm.connectionLabel`, { name })}
          onCheckedChange={() => onChange(toggleConnection(scope, whole))}
        />
        <ProviderLogo provider={connection.provider} size="sm" />
        <span className="min-w-0 truncate text-sm font-medium text-fg">
          {name}
        </span>
        {state === 'checked' ? (
          <Badge variant="blue">{t(`${PREFIX}.keyForm.wholeConnection`)}</Badge>
        ) : null}
        <span className="ml-auto shrink-0 text-xs text-fg-subtle">
          {state === 'checked'
            ? t(`${PREFIX}.keyForm.countOpen`, { count: open.length })
            : t(`${PREFIX}.keyForm.countPicked`, {
                picked: picked.length,
                total: open.length,
              })}
        </span>
      </div>
      <ul>
        {connection.models.map((model) => {
          const checked = modelChecked(scope, model)
          const reason = modelStateLabel(t, model)
          return (
            <li
              key={model.model_id}
              className={cn(
                'flex items-center gap-space-sm py-space-xs pr-space-md pl-space-2xl',
                !isCallable(model) && 'text-fg-subtle',
              )}
            >
              <Checkbox
                checked={checked}
                disabled={disabled || (!isCallable(model) && !checked)}
                aria-label={t(`${PREFIX}.keyForm.modelLabel`, {
                  name: model.call_name,
                })}
                onCheckedChange={() =>
                  onChange(toggleModel(scope, whole, model))
                }
              />
              <span className="min-w-0 flex-1 truncate font-mono text-sm">
                {model.call_name}
              </span>
              {reason ? <Badge variant="outline">{reason}</Badge> : null}
              {model.model_types.slice(0, 2).map((type) => (
                <Badge key={type} variant="secondary">
                  {capabilityLabel(t, type)}
                </Badge>
              ))}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
