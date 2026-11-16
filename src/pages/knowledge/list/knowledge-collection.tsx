import { useTranslation } from 'react-i18next'
import {
  CircleDashed,
  FileText,
  Lock,
  Users,
  type LucideIcon,
} from 'lucide-react'
import {
  ResourceCard,
  ResourceGrid,
  ResourceList,
  ResourceListHeader,
  ResourceRow,
  type CollectionView,
  type ResourceItemProps,
} from '@/components/patterns'
import type { KnowledgeBase } from '@/types/api'
import {
  KnowledgeMeta,
  KnowledgeRowActions,
  KnowledgeVisibilityBadge,
  type KnowledgeRowActionHandlers,
} from './knowledge-item-parts'
import { groupKnowledgeBases } from './utils'
import type {
  KnowledgeGroupBy,
  KnowledgeGroupKey,
  KnowledgeTimeFormat,
} from './types'

const GROUP_ICONS: Record<Exclude<KnowledgeGroupKey, 'all'>, LucideIcon> = {
  empty: CircleDashed,
  hasDocuments: FileText,
  me: Lock,
  team: Users,
}

function GroupHeading({
  groupKey,
  count,
}: {
  groupKey: Exclude<KnowledgeGroupKey, 'all'>
  count: number
}) {
  const { t } = useTranslation()
  const Icon = GROUP_ICONS[groupKey]
  return (
    <h2
      data-slot="knowledge-group"
      data-group={groupKey}
      className="flex items-center gap-space-xs border-b border-border-subtle bg-background-subtle px-space-md py-space-xs text-xs font-medium text-text-secondary"
    >
      <Icon className="size-icon-xs shrink-0" aria-hidden="true" />
      {t(`knowledge.list.groups.${groupKey}`)}
      <span className="text-text-tertiary tabular-nums">{count}</span>
    </h2>
  )
}

interface KnowledgeCollectionProps {
  knowledgeBases: KnowledgeBase[]
  viewMode: CollectionView
  groupBy: KnowledgeGroupBy
  timeFormat: KnowledgeTimeFormat
  selectedIds: string[]
  onToggleSelected: (id: string, checked: boolean) => void
  onTogglePage: (checked: boolean) => void
  handlers: KnowledgeRowActionHandlers
}

/** The loaded page as grouped rows (default) or cards, with selection. */
export function KnowledgeCollection({
  knowledgeBases,
  viewMode,
  groupBy,
  timeFormat,
  selectedIds,
  onToggleSelected,
  onTogglePage,
  handlers,
}: KnowledgeCollectionProps) {
  const { t } = useTranslation()
  const groups = groupKnowledgeBases(knowledgeBases, groupBy)
  const selectedOnPage = knowledgeBases.filter((knowledgeBase) =>
    selectedIds.includes(knowledgeBase.id),
  ).length
  const allSelected =
    knowledgeBases.length > 0 && selectedOnPage === knowledgeBases.length

  const item = (knowledgeBase: KnowledgeBase): ResourceItemProps => ({
    name: knowledgeBase.name,
    description:
      knowledgeBase.description || t('knowledge.common.emptyDescription'),
    avatar: { src: knowledgeBase.avatar, seed: knowledgeBase.id },
    status: <KnowledgeVisibilityBadge knowledgeBase={knowledgeBase} />,
    actions: (
      <KnowledgeRowActions knowledgeBase={knowledgeBase} handlers={handlers} />
    ),
    onOpen: () => handlers.onOpen(knowledgeBase),
    selection: {
      checked: selectedIds.includes(knowledgeBase.id),
      onCheckedChange: (checked) => onToggleSelected(knowledgeBase.id, checked),
      label: t('knowledge.list.select', { name: knowledgeBase.name }),
    },
  })

  const label = t('knowledge.list.title')

  if (viewMode === 'grid')
    return (
      <div data-slot="knowledge-collection">
        {groups.map((group) => (
          <div key={group.key}>
            {group.key !== 'all' ? (
              <GroupHeading groupKey={group.key} count={group.items.length} />
            ) : null}
            <ResourceGrid
              label={
                group.key === 'all'
                  ? label
                  : t(`knowledge.list.groups.${group.key}`)
              }
            >
              {group.items.map((knowledgeBase) => (
                <ResourceCard
                  key={knowledgeBase.id}
                  {...item(knowledgeBase)}
                  meta={
                    <KnowledgeMeta
                      knowledgeBase={knowledgeBase}
                      timeFormat={timeFormat}
                    />
                  }
                />
              ))}
            </ResourceGrid>
          </div>
        ))}
      </div>
    )

  return (
    <div data-slot="knowledge-collection">
      <ResourceListHeader
        name={t('common.name')}
        status={t('knowledge.list.columns.visibility')}
        meta={t('knowledge.list.columns.content')}
        selection={{
          checked: allSelected,
          indeterminate: selectedOnPage > 0 && !allSelected,
          onCheckedChange: onTogglePage,
          label: t('knowledge.list.selectPage'),
        }}
      />
      {groups.map((group) => (
        <ResourceList
          key={group.key}
          label={
            group.key === 'all'
              ? label
              : t(`knowledge.list.groups.${group.key}`)
          }
          header={
            group.key !== 'all' ? (
              <GroupHeading groupKey={group.key} count={group.items.length} />
            ) : undefined
          }
        >
          {group.items.map((knowledgeBase) => (
            <ResourceRow
              key={knowledgeBase.id}
              {...item(knowledgeBase)}
              meta={
                <KnowledgeMeta
                  knowledgeBase={knowledgeBase}
                  timeFormat={timeFormat}
                  compact
                />
              }
            />
          ))}
        </ResourceList>
      ))}
    </div>
  )
}
