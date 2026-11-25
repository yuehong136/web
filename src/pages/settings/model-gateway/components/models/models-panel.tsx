import { useState } from 'react'
import {
  Boxes,
  ChevronsDownUp,
  ChevronsUpDown,
  Search,
  SearchX,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import type {
  GatewayCatalog,
  GatewayCatalogModel,
  GatewayModelState,
} from '@/api/model-gateway'
import { FilterChip, PageEmptyState } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { groupCatalog, isCallable, unsupportedProviders } from '../../catalog'
import {
  EXPAND_ALL_MAX_MODELS,
  useCatalogExpansionStore,
  useGroupExpansion,
} from '../../expansion'
import { PREFIX } from '../../utils'
import { ConnectionCard } from './connection-card'
import { ModelSettingsDialog } from './model-settings-dialog'
import { NewModelsDefault } from './new-models-default'
import { UnsupportedProviderCard } from './unsupported-provider-card'

type CapabilityFilter = 'all' | 'chat' | 'embedding'
const STATES: GatewayModelState[] = ['callable', 'closed', 'unavailable']

function matchesSearch(model: GatewayCatalogModel, query: string) {
  if (!query) return true
  const haystack = [
    ...model.names,
    model.model_name,
    model.provider,
    model.instance_name,
  ]
  return haystack.some((value) => value.toLowerCase().includes(query))
}

/**
 * The catalog: every registered model of every connection, with the open
 * switch that caps what any key can call.
 */
export function ModelsPanel({ catalog }: { catalog: GatewayCatalog }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [capability, setCapability] = useState<CapabilityFilter>('all')
  const [providers, setProviders] = useState<string[]>([])
  const [states, setStates] = useState<string[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const editing = catalog.models.find((model) => model.model_id === editingId)

  const query = search.trim().toLowerCase()
  const groups = groupCatalog(
    catalog,
    (model) =>
      matchesSearch(model, query) &&
      (capability === 'all' || model.model_types.includes(capability)) &&
      (providers.length === 0 || providers.includes(model.provider)) &&
      (states.length === 0 || states.includes(model.state)),
  )
  const unsupported = unsupportedProviders(catalog)
  const counted = catalog.models.filter(
    (model) => !unsupported.has(model.provider),
  )
  const providerOptions = [
    ...new Set(catalog.models.map((model) => model.provider)),
  ].map((provider) => ({ value: provider, label: provider }))
  const connections = groups
    .filter((group) => !group.unsupported)
    .flatMap((group) => group.connections)
  const connectionIds = connections.map((connection) => connection.instance_id)
  // A long catalog opens collapsed; a search or a provider pick opens what
  // it found without touching the cards the user opened or closed.
  const expansion = useGroupExpansion({
    chosen: useCatalogExpansionStore((state) => state.chosen),
    onChoose: useCatalogExpansionStore((state) => state.choose),
    defaultOpen: () => counted.length <= EXPAND_ALL_MAX_MODELS,
    searchKey: [query, ...providers, ...states].filter(Boolean).join(' '),
  })
  const anyOpen = connectionIds.some(expansion.isOpen)

  if (catalog.models.length === 0)
    return (
      <div className="flex flex-col gap-space-lg">
        <Intro catalog={catalog} />
        <PageEmptyState
          title={t(`${PREFIX}.models.empty`)}
          description={t(`${PREFIX}.models.emptyDescription`)}
          icon={<Boxes className="size-icon-lg" aria-hidden="true" />}
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/settings/model-providers')}
            >
              {t(`${PREFIX}.models.goProviders`)}
            </Button>
          }
        />
      </div>
    )

  return (
    <div className="flex flex-col gap-space-lg">
      <Intro catalog={catalog} />
      <div className="flex flex-wrap items-center gap-space-sm">
        <div className="w-full sm:w-64">
          <Input
            type="search"
            inputSize="sm"
            aria-label={t(`${PREFIX}.models.search`)}
            placeholder={t(`${PREFIX}.models.search`)}
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
            { value: 'all', label: t(`${PREFIX}.capabilityFilter.all`) },
            { value: 'chat', label: t(`${PREFIX}.capabilities.chat`) },
            {
              value: 'embedding',
              label: t(`${PREFIX}.capabilities.embedding`),
            },
          ]}
        />
        <FilterChip
          filter={{
            key: 'provider',
            label: t(`${PREFIX}.models.allProviders`),
            options: providerOptions,
            value: providers,
            selection: 'single',
          }}
          onChange={setProviders}
        />
        <FilterChip
          filter={{
            key: 'state',
            label: t(`${PREFIX}.models.allStates`),
            options: STATES.map((state) => ({
              value: state,
              label: t(`${PREFIX}.models.stateFilter.${state}`),
            })),
            value: states,
            selection: 'single',
          }}
          onChange={setStates}
        />
        {connections.length > 1 ? (
          <Button
            size="sm"
            variant="ghost"
            leftIcon={
              anyOpen ? (
                <ChevronsDownUp className="size-icon-sm" aria-hidden="true" />
              ) : (
                <ChevronsUpDown className="size-icon-sm" aria-hidden="true" />
              )
            }
            onClick={() => expansion.setAll(connectionIds, !anyOpen)}
          >
            {t(`${PREFIX}.models.${anyOpen ? 'collapseAll' : 'expandAll'}`)}
          </Button>
        ) : null}
        <p className="ml-auto text-sm text-fg-subtle" aria-live="polite">
          {[
            t(`${PREFIX}.models.summary`, {
              open: counted.filter(isCallable).length,
              total: counted.length,
            }),
            unsupported.size > 0
              ? t(`${PREFIX}.models.unsupportedSummary`, {
                  count: unsupported.size,
                })
              : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>

      {groups.length === 0 ? (
        <PageEmptyState
          title={t(`${PREFIX}.models.noMatch`)}
          description={t(`${PREFIX}.models.noMatchDescription`)}
          icon={<SearchX className="size-icon-lg" aria-hidden="true" />}
        />
      ) : null}
      {connections.map((connection) => (
        <ConnectionCard
          key={connection.instance_id}
          connection={connection}
          allModels={catalog.models.filter(
            (model) => model.instance_id === connection.instance_id,
          )}
          open={expansion.isOpen(connection.instance_id)}
          onOpenChange={(open) =>
            expansion.setOpen(connection.instance_id, open)
          }
          onEdit={(model) => setEditingId(model.model_id)}
        />
      ))}
      {groups
        .filter((group) => group.unsupported)
        .map((group) => (
          <UnsupportedProviderCard key={group.provider} group={group} />
        ))}

      {editing ? (
        <ModelSettingsDialog
          model={editing}
          onClose={() => setEditingId(null)}
        />
      ) : null}
    </div>
  )
}

function Intro({ catalog }: { catalog: GatewayCatalog }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-wrap items-start justify-between gap-space-md">
      <p className="max-w-2xl min-w-0 flex-1 basis-80 text-sm text-fg-muted">
        {t(`${PREFIX}.models.intro`)}
      </p>
      <NewModelsDefault enabled={catalog.new_models_enabled} />
    </div>
  )
}
