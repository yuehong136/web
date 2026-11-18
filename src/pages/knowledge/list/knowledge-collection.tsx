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
import { ResourceCreateCard } from '@/components/patterns/resource-card'
import { knowledgeAvatar } from '@/components/knowledge/knowledge-identity'
import type { KnowledgeBase } from '@/types/api'
import {
  KnowledgeCardChips,
  KnowledgeCardMeta,
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
  grid = false,
}: {
  groupKey: Exclude<KnowledgeGroupKey, 'all'>
  count: number
  grid?: boolean
}) {
  const { t } = useTranslation()
  const Icon = GROUP_ICONS[groupKey]
  return (
    <h2
      data-slot="knowledge-group"
      data-group={groupKey}
      className={
        grid
          ? 'flex items-center gap-space-xs px-space-md pt-space-md text-xs font-medium text-fg-muted'
          : 'flex items-center gap-space-xs border-b border-line-subtle bg-sunken px-space-md py-space-xs text-xs font-medium text-fg-muted'
      }
    >
      <Icon className="size-icon-xs shrink-0" aria-hidden="true" />
      {t(`knowledge.list.groups.${groupKey}`)}
      <span className="text-fg-subtle tabular-nums">{count}</span>
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
  /** Ends the grid with a "new knowledge base" card. */
  onCreate?: () => void
}

/** The loaded page as grouped rows or cards, with selection. */
export function KnowledgeCollection({
  knowledgeBases,
  viewMode,
  groupBy,
  timeFormat,
  selectedIds,
  onToggleSelected,
  onTogglePage,
  handlers,
  onCreate,
}: KnowledgeCollectionProps) {
  const { t } = useTranslation()
  const groups = groupKnowledgeBases(knowledgeBases, groupBy)
  const selectedOnPage = knowledgeBases.filter((knowledgeBase) =>
    selectedIds.includes(knowledgeBase.id),
  ).length
  const allSelected =
    knowledgeBases.length > 0 && selectedOnPage === knowledgeBases.length

  const item = (
    knowledgeBase: KnowledgeBase,
    compactActions: boolean,
  ): ResourceItemProps => ({
    name: knowledgeBase.name,
    description:
      knowledgeBase.description || t('knowledge.common.emptyDescription'),
    avatar: knowledgeAvatar(knowledgeBase),
    status: <KnowledgeVisibilityBadge knowledgeBase={knowledgeBase} />,
    actions: (
      <KnowledgeRowActions
        knowledgeBase={knowledgeBase}
        handlers={handlers}
        compact={compactActions}
      />
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
        {groups.map((group, index) => (
          <section
            key={group.key}
            aria-label={
              group.key === 'all'
                ? undefined
                : t(`knowledge.list.groups.${group.key}`)
            }
          >
            {group.key !== 'all' ? (
              <GroupHeading
                groupKey={group.key}
                count={group.items.length}
                grid
              />
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
                  {...item(knowledgeBase, true)}
                  chips={<KnowledgeCardChips knowledgeBase={knowledgeBase} />}
                  meta={
                    <KnowledgeCardMeta
                      knowledgeBase={knowledgeBase}
                      timeFormat={timeFormat}
                    />
                  }
                />
              ))}
              {onCreate && index === groups.length - 1 ? (
                <ResourceCreateCard
                  label={t('knowledge.list.actions.create')}
                  description={t('knowledge.list.createCard')}
                  onClick={onCreate}
                />
              ) : null}
            </ResourceGrid>
          </section>
        ))}
      </div>
    )

  return (
    <div data-slot="knowledge-collection">
      <ResourceListHeader
        name={t('common.name')}
        status={t('knowledge.list.columns.visibility')}
        meta={t('knowledge.list.columns.content')}
        withAvatar
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
              {...item(knowledgeBase, false)}
              meta={
                <KnowledgeMeta
                  knowledgeBase={knowledgeBase}
                  timeFormat={timeFormat}
                />
              }
            />
          ))}
        </ResourceList>
      ))}
    </div>
  )
}
