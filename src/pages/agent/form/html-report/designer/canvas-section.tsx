/** 画布里的单个小节卡:小节排序把手、布局切换、删除,内含可放置/可排序的块列表。 */
import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { SIDEBAR_LAYOUTS } from './block-meta'
import { CanvasBlockChip } from './canvas-block-chip'
import type { SectionDragData, SlotDropData } from './dnd'
import type { BlockRole, SkeletonSection } from '../types'

interface CanvasSectionProps {
  section: SkeletonSection
  index: number
  selectedBlockId?: string
  sectionSelected: boolean
  onSelectSection: () => void
  onSelectBlock: (blockId: string) => void
  onRemoveSection: () => void
  onRemoveBlock: (blockId: string) => void
  onSetBlockRole: (blockId: string, role: BlockRole) => void
}

export function CanvasSection({
  section,
  index,
  selectedBlockId,
  sectionSelected,
  onSelectSection,
  onSelectBlock,
  onRemoveSection,
  onRemoveBlock,
  onSetBlockRole,
}: CanvasSectionProps) {
  const { t } = useTranslation()
  const isSidebar = SIDEBAR_LAYOUTS.has(section.layout)

  const sectionData: SectionDragData = {
    source: 'section',
    sectionId: section.id,
    index,
  }
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `section:${section.id}`,
    data: sectionData,
  })
  const style = { transform: CSS.Transform.toString(transform), transition }

  const slotData: SlotDropData = { source: 'slot', sectionId: section.id }
  const { setNodeRef: setSlotRef, isOver } = useDroppable({
    id: `slot:${section.id}`,
    data: slotData,
  })

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-radius-lg bg-surface-secondary p-space-sm border',
        sectionSelected ? 'border-border-focus' : 'border-border-default',
        isDragging && 'opacity-50',
      )}
    >
      <div className="mb-space-sm gap-space-xs flex items-center">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="text-text-caption cursor-grab active:cursor-grabbing"
          aria-label={t(
            'flow.htmlReportDragSection',
            'Drag to reorder section',
          )}
        >
          <GripVertical className="size-icon-sm" />
        </button>
        <button
          type="button"
          onClick={onSelectSection}
          className="text-xs font-medium text-text-secondary hover:text-text-primary"
        >
          {t('flow.htmlReportSection', 'Section')} {index + 1}
        </button>
        <button
          type="button"
          onClick={onRemoveSection}
          className="text-text-caption ml-auto hover:text-status-error"
          aria-label={t('flow.htmlReportDeleteSection', 'Delete section')}
        >
          <Trash2 className="size-icon-sm" />
        </button>
      </div>

      <div
        ref={setSlotRef}
        className={cn(
          'space-y-space-xs rounded-radius-md p-space-xs min-h-12 border border-dashed',
          isOver
            ? 'border-border-focus bg-state-hover'
            : 'border-border-subtle',
        )}
      >
        {section.blocks.length === 0 ? (
          <p className="py-space-sm text-text-caption text-center text-xs">
            {t('flow.htmlReportDropHint', 'Drag blocks here')}
          </p>
        ) : (
          <SortableContext
            items={section.blocks.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            {section.blocks.map((block, blockIndex) => (
              <CanvasBlockChip
                key={block.id}
                block={block}
                sectionId={section.id}
                index={blockIndex}
                isSidebar={isSidebar}
                selected={block.id === selectedBlockId}
                onSelect={() => onSelectBlock(block.id)}
                onDelete={() => onRemoveBlock(block.id)}
                onToggleRole={(role) => onSetBlockRole(block.id, role)}
              />
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  )
}
