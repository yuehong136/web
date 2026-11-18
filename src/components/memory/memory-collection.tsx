import { useTranslation } from 'react-i18next'
import {
  Clock3,
  LockKeyhole,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
} from 'lucide-react'
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
import { ResourceCreateCard } from '@/components/patterns/resource-card'
import { ModelChip } from '@/components/studio'
import {
  ActionMenu,
  ActionMenuContent,
  ActionMenuItem,
  ActionMenuSeparator,
  ActionMenuTrigger,
} from '@/components/ui/action-menu'
import { Button } from '@/components/ui/button'
import type { Memory, StorageType } from '@/types/memory'
import { MemoryTypeBadge } from './memory-labels'

const MEMORY_TYPES = ['raw', 'semantic', 'episodic', 'procedural']
const STORAGE_TYPES: StorageType[] = ['table', 'graph']

interface MemoryFilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  memoryType: string[]
  onMemoryTypeChange: (value: string[]) => void
  storageType: string
  onStorageTypeChange: (value: string) => void
  onClearFilters: () => void
  view: CollectionView
  onViewChange: (view: CollectionView) => void
}

/** Search, memory-type and storage chips (server filters) and the view. */
export function MemoryFilterBar({
  search,
  onSearchChange,
  memoryType,
  onMemoryTypeChange,
  storageType,
  onStorageTypeChange,
  onClearFilters,
  view,
  onViewChange,
}: MemoryFilterBarProps) {
  const { t } = useTranslation()
  return (
    <FilterBar
      search={{
        value: search,
        onChange: onSearchChange,
        placeholder: t('memory.filters.searchPlaceholder'),
      }}
      filters={[
        {
          key: 'memoryType',
          label: t('memory.filters.memoryType'),
          value: memoryType,
          options: MEMORY_TYPES.map((value) => ({
            value,
            label: t(`memory.filters.${value}`),
          })),
        },
        {
          key: 'storageType',
          label: t('memory.fields.storageType'),
          selection: 'single',
          value: storageType ? [storageType] : [],
          options: STORAGE_TYPES.map((value) => ({
            value,
            label: t(`memory.fields.${value}`),
          })),
        },
      ]}
      onFilterChange={(key, value) =>
        key === 'memoryType'
          ? onMemoryTypeChange(value)
          : onStorageTypeChange(value[0] ?? '')
      }
      onClearFilters={onClearFilters}
      view={{ value: view, onChange: onViewChange }}
    />
  )
}

function MemoryPermission({ memory }: { memory: Memory }) {
  const { t } = useTranslation()
  const Icon = memory.permissions === 'team' ? Users : LockKeyhole
  return (
    <span className="inline-flex items-center gap-space-xs text-xs text-fg-subtle">
      <Icon className="size-icon-xs shrink-0" aria-hidden="true" />
      {t(
        memory.permissions === 'team'
          ? 'memory.fields.team'
          : 'memory.fields.onlyMe',
      )}
    </span>
  )
}

/** Storage type and last update. */
function MemoryMeta({ memory }: { memory: Memory }) {
  const { t, i18n } = useTranslation()
  const time = memory.update_time ?? memory.create_time
  return (
    <>
      <span>
        {t(
          memory.storage_type === 'graph'
            ? 'memory.fields.graph'
            : 'memory.fields.table',
        )}
      </span>
      <span className="inline-flex min-w-0 items-center gap-space-xs">
        <Clock3 className="size-icon-xs shrink-0" aria-hidden="true" />
        <time
          className="truncate"
          dateTime={time ? new Date(time).toISOString() : undefined}
        >
          {time
            ? new Intl.DateTimeFormat(i18n.resolvedLanguage, {
                dateStyle: 'medium',
              }).format(time)
            : '—'}
        </time>
      </span>
    </>
  )
}

interface MemoryCollectionProps {
  memories: Memory[]
  view: CollectionView
  onOpen: (memory: Memory) => void
  onEdit: (memory: Memory) => void
  onDelete: (memory: Memory) => void
  /** Ends the grid with a "create memory bank" card. */
  onCreate?: () => void
}

/** The current page of memory banks as cards or rows. */
export function MemoryCollection({
  memories,
  view,
  onOpen,
  onEdit,
  onDelete,
  onCreate,
}: MemoryCollectionProps) {
  const { t } = useTranslation()
  const item = (memory: Memory): ResourceItemProps => ({
    name: memory.name,
    description: memory.description || t('memory.workspace.cardDescription'),
    avatar: { src: memory.avatar, seed: memory.id, badge: 'memory' },
    status: <MemoryPermission memory={memory} />,
    meta: <MemoryMeta memory={memory} />,
    onOpen: () => onOpen(memory),
    actions: (
      <ActionMenu>
        <ActionMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t('memory.workspace.memoryActions', {
              name: memory.name,
            })}
          >
            <MoreHorizontal className="size-icon-sm" aria-hidden="true" />
          </Button>
        </ActionMenuTrigger>
        <ActionMenuContent align="end">
          <ActionMenuItem onSelect={() => onEdit(memory)}>
            <Pencil className="size-icon-sm" aria-hidden="true" />
            {t('common.edit')}
          </ActionMenuItem>
          <ActionMenuSeparator />
          <ActionMenuItem danger onSelect={() => onDelete(memory)}>
            <Trash2 className="size-icon-sm" aria-hidden="true" />
            {t('common.delete')}
          </ActionMenuItem>
        </ActionMenuContent>
      </ActionMenu>
    ),
  })

  if (view === 'grid')
    return (
      <ResourceGrid label={t('memory.page.title')}>
        {memories.map((memory) => (
          <ResourceCard
            key={memory.id}
            {...item(memory)}
            // Permission moves to the eyebrow on cards.
            eyebrow={<MemoryPermission memory={memory} />}
            status={undefined}
            chips={
              <>
                <ModelChip reference={memory.llm_id} />
                {memory.memory_type.map((type) => (
                  <MemoryTypeBadge key={type} type={type} />
                ))}
              </>
            }
          />
        ))}
        {onCreate ? (
          <ResourceCreateCard
            label={t('memory.page.create')}
            description={t('memory.empty.createCardDescription')}
            onClick={onCreate}
          />
        ) : null}
      </ResourceGrid>
    )
  return (
    <ResourceList
      label={t('memory.page.title')}
      header={
        <ResourceListHeader
          name={t('common.name')}
          status={t('memory.fields.permission')}
          meta={t('memory.fields.updatedAt')}
        />
      }
    >
      {memories.map((memory) => (
        <ResourceRow key={memory.id} {...item(memory)} />
      ))}
    </ResourceList>
  )
}
