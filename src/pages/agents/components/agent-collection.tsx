import { useTranslation } from 'react-i18next'
import { Clock, GitBranch } from 'lucide-react'
import {
  FilterBar,
  ResourceCard,
  ResourceGrid,
  ResourceList,
  ResourceListHeader,
  ResourceRow,
  type CollectionView,
  type ResourceItemProps,
} from '@/components/patterns'
import { Badge } from '@/components/ui/badge'
import {
  countFlowNodes,
  isPipelineFlow,
  resolveLocalizedText,
} from '@/lib/agent'
import {
  formatRelativeTime,
  formatTimestampCompact,
  formatTimestampDetailed,
} from '@/lib/utils'
import { AgentCanvasType, type AgentFlow } from '@/types/agent'
import { AgentActions, type AgentActionProps } from './agent-actions'
import { AgentTags } from './agent-tags'

export type AgentTimeFormat = 'detailed' | 'compact' | 'relative'
export type AgentKindFilter = 'all' | AgentCanvasType

interface AgentFilterBarProps {
  keyword: string
  onKeywordChange: (value: string) => void
  kind: AgentKindFilter
  onKindChange: (kind: AgentKindFilter) => void
  tags: string[]
  /** Tenant-wide tag counts from the tags endpoint. */
  tagCounts: { tag: string; count: number }[]
  onTagsChange: (tags: string[]) => void
  onClearFilters: () => void
  sortDescending: boolean
  onSortDescendingChange: (descending: boolean) => void
  timeFormat: AgentTimeFormat
  onTimeFormatChange: (format: AgentTimeFormat) => void
  view: CollectionView
  onViewChange: (view: CollectionView) => void
}

/** Search, type and tag chips, one sort/time menu and the list/grid switch. */
export function AgentFilterBar({
  keyword,
  onKeywordChange,
  kind,
  onKindChange,
  tags,
  tagCounts,
  onTagsChange,
  onClearFilters,
  sortDescending,
  onSortDescendingChange,
  timeFormat,
  onTimeFormatChange,
  view,
  onViewChange,
}: AgentFilterBarProps) {
  const { t } = useTranslation()
  const tagOptions = [
    ...new Set([...tagCounts.map(({ tag }) => tag), ...tags]),
  ].map((tag) => ({
    value: tag,
    label: t('agents.tagOption', {
      tag,
      count: tagCounts.find((entry) => entry.tag === tag)?.count ?? 0,
    }),
  }))
  return (
    <FilterBar
      search={{
        value: keyword,
        onChange: onKeywordChange,
        placeholder: t('agents.searchPlaceholder'),
      }}
      filters={[
        {
          key: 'kind',
          label: t('agents.type'),
          selection: 'single',
          value: kind === 'all' ? [] : [kind],
          options: [
            { value: AgentCanvasType.AGENT, label: t('agents.agents') },
            { value: AgentCanvasType.PIPELINE, label: t('agents.pipelines') },
          ],
        },
        {
          key: 'tags',
          label: t('agents.tags'),
          value: tags,
          options: tagOptions,
        },
      ]}
      onFilterChange={(key, value) => {
        if (key === 'kind')
          onKindChange((value[0] as AgentCanvasType | undefined) ?? 'all')
        else onTagsChange(value)
      }}
      onClearFilters={onClearFilters}
      sort={{
        value: sortDescending ? 'desc' : 'asc',
        onChange: (value) => onSortDescendingChange(value === 'desc'),
        options: [
          { value: 'desc', label: t('agents.descending') },
          { value: 'asc', label: t('agents.ascending') },
        ],
      }}
      display={[
        {
          key: 'time',
          label: t('agents.timeFormat'),
          value: timeFormat,
          onChange: (value) => onTimeFormatChange(value as AgentTimeFormat),
          options: [
            { value: 'detailed', label: t('agents.detailedTime') },
            { value: 'compact', label: t('agents.compactTime') },
            { value: 'relative', label: t('agents.relativeTime') },
          ],
        },
      ]}
      view={{ value: view, onChange: onViewChange }}
    />
  )
}

function AgentKindBadge({ flow }: { flow: AgentFlow }) {
  const { t } = useTranslation()
  return (
    <Badge variant="secondary">
      {t(isPipelineFlow(flow) ? 'agents.kindPipeline' : 'agents.kindAgent')}
    </Badge>
  )
}

/** Node count and update time; `compact` fits the row's meta column. */
function AgentMeta({
  flow,
  timeFormat,
  compact = false,
}: {
  flow: AgentFlow
  timeFormat: AgentTimeFormat
  compact?: boolean
}) {
  const { t } = useTranslation()
  const timestamp = flow.update_time
  const valid =
    Number.isFinite(timestamp) && timestamp >= 0 && timestamp <= 4102444800000
  const formatted = valid
    ? (timeFormat === 'relative'
        ? formatRelativeTime
        : timeFormat === 'compact'
          ? formatTimestampCompact
          : formatTimestampDetailed)(timestamp)
    : t('agents.noUpdateTime')
  const nodes = t('agents.nodeCount', { count: countFlowNodes(flow) })
  return (
    <>
      <span
        className="inline-flex items-center gap-space-xs"
        title={compact ? nodes : undefined}
      >
        <GitBranch className="size-icon-xs shrink-0" aria-hidden="true" />
        {compact ? (
          <>
            <span className="sr-only">{nodes}</span>
            <span aria-hidden="true">{countFlowNodes(flow)}</span>
          </>
        ) : (
          nodes
        )}
      </span>
      <span className="inline-flex min-w-0 items-center gap-space-xs">
        <Clock className="size-icon-xs shrink-0" aria-hidden="true" />
        <time
          className="truncate"
          dateTime={valid ? new Date(timestamp).toISOString() : undefined}
        >
          {formatted}
        </time>
      </span>
    </>
  )
}

interface AgentCollectionProps extends Omit<
  AgentActionProps,
  'flow' | 'onEditTags'
> {
  agents: AgentFlow[]
  view: CollectionView
  timeFormat: AgentTimeFormat
  /** Only the owner may edit tags. */
  currentUserId?: string
  onEditTags?: (flow: AgentFlow) => void
}

/** The current page of agents and pipelines as rows (default) or cards. */
export function AgentCollection({
  agents,
  view,
  timeFormat,
  currentUserId,
  onEditTags,
  ...actions
}: AgentCollectionProps) {
  const { t } = useTranslation()
  const item = (flow: AgentFlow): ResourceItemProps => {
    const title = resolveLocalizedText(flow.title, t('agents.unnamedAgent'))
    const owned =
      Boolean(currentUserId) &&
      (flow.user_id || flow.tenant_id) === currentUserId
    return {
      name: title,
      description:
        resolveLocalizedText(flow.description, '') || t('agents.noDescription'),
      avatar: { src: flow.avatar, seed: flow.id },
      onOpen: () => actions.onOpen(flow),
      actions: (
        <AgentActions
          flow={flow}
          title={title}
          {...actions}
          onEditTags={owned ? onEditTags : undefined}
        />
      ),
    }
  }

  if (view === 'grid')
    return (
      <ResourceGrid label={t('agents.center')}>
        {agents.map((flow) => (
          <ResourceCard
            key={flow.id}
            {...item(flow)}
            eyebrow={t(
              isPipelineFlow(flow) ? 'agents.kindPipeline' : 'agents.kindAgent',
            )}
            status={flow.tags ? <AgentTags tags={flow.tags} /> : undefined}
            meta={<AgentMeta flow={flow} timeFormat={timeFormat} />}
          />
        ))}
      </ResourceGrid>
    )
  return (
    <ResourceList
      label={t('agents.center')}
      header={
        <ResourceListHeader
          name={t('common.name')}
          status={t('agents.type')}
          meta={t('common.updateTime')}
        />
      }
    >
      {agents.map((flow) => (
        <ResourceRow
          key={flow.id}
          {...item(flow)}
          status={<AgentKindBadge flow={flow} />}
          meta={<AgentMeta flow={flow} timeFormat={timeFormat} compact />}
        />
      ))}
    </ResourceList>
  )
}
