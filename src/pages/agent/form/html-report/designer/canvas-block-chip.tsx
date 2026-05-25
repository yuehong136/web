/** 画布里的单个块芯片:可排序拖拽(grip 把手)、选中高亮、删除、sidebar 下切换 role。 */
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { blockDisplayLabel } from './block-meta'
import type { BlockDragData } from './dnd'
import type { BlockRole, SkeletonBlock } from '../types'

interface CanvasBlockChipProps {
  block: SkeletonBlock
  sectionId: string
  index: number
  isSidebar: boolean
  selected: boolean
  onSelect: () => void
  onDelete: () => void
  onToggleRole: (role: BlockRole) => void
}

export function CanvasBlockChip({
  block,
  sectionId,
  index,
  isSidebar,
  selected,
  onSelect,
  onDelete,
  onToggleRole,
}: CanvasBlockChipProps) {
  const { t } = useTranslation()
  const label = blockDisplayLabel(block)
  const data: BlockDragData = {
    source: 'block',
    sectionId,
    index,
    role: block.role,
  }
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: block.id,
    data,
  })

  const style = { transform: CSS.Transform.toString(transform), transition }
  const role: BlockRole = block.role ?? 'main'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'gap-space-xs rounded-radius-md bg-surface-primary px-space-xs py-space-xs flex items-center border',
        selected
          ? 'border-border-focus ring-1 ring-state-focus'
          : 'border-border-default',
        isDragging && 'opacity-50',
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="text-text-caption cursor-grab active:cursor-grabbing"
        aria-label={t('flow.htmlReportDragHandle', 'Drag to reorder')}
      >
        <GripVertical className="size-icon-sm" />
      </button>

      <button
        type="button"
        onClick={onSelect}
        className="flex-1 truncate text-left text-xs text-text-primary"
      >
        {t(label.labelKey, label.fallback)}
      </button>

      {isSidebar && (
        <button
          type="button"
          onClick={() => onToggleRole(role === 'main' ? 'side' : 'main')}
          className="rounded-radius-sm bg-surface-secondary px-space-xs text-xs text-text-secondary hover:bg-state-hover"
        >
          {role === 'side'
            ? t('flow.htmlReportRoleSide', 'Side')
            : t('flow.htmlReportRoleMain', 'Main')}
        </button>
      )}

      <button
        type="button"
        onClick={onDelete}
        className="text-text-caption hover:text-status-error"
        aria-label={t('flow.htmlReportDeleteBlock', 'Delete block')}
      >
        <Trash2 className="size-icon-sm" />
      </button>
    </div>
  )
}
