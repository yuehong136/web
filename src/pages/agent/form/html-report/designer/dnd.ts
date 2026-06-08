/**
 * Designer 拖拽解析。把 dnd-kit 的 DragEndEvent 翻译成一个 DraftAction。
 *
 * 拖拽源(active.data.current):
 *   palette  调色板里的块/图表类型 → 新增 Block
 *   block    画布里已有的块        → 段内重排 / 跨段移动
 *   section  小节卡(经把手)        → 小节重排
 * 放置目标(over.data.current):
 *   slot     某小节的放置区(sidebar 布局拆 main/side,落入即定 role)
 *   block    某个块(插到它前面,沿用它的 role)
 *   section  小节卡本体(落到该小节末尾)
 */
import type { DragEndEvent } from '@dnd-kit/core'
import { createDefaultBlock } from './block-defaults'
import type { DraftAction } from './use-skeleton-draft'
import type { BlockKind, BlockRole, ChartType, SkeletonSchema } from '../types'

export interface PaletteDragData {
  source: 'palette'
  blockType: BlockKind
  chartType?: ChartType
}
export interface BlockDragData {
  source: 'block'
  sectionId: string
  index: number
  role?: BlockRole
}
export interface SectionDragData {
  source: 'section'
  sectionId: string
  index: number
}
export interface SlotDropData {
  source: 'slot'
  sectionId: string
  role?: BlockRole
}

type DragData = PaletteDragData | BlockDragData | SectionDragData | SlotDropData

interface DropTarget {
  sectionId: string
  index: number
  role?: BlockRole
}

function sectionEnd(present: SkeletonSchema, sectionId: string): number {
  return present.sections.find((s) => s.id === sectionId)?.blocks.length ?? 0
}

function resolveDropTarget(
  over: DragData,
  present: SkeletonSchema,
): DropTarget | null {
  if (over.source === 'slot') {
    return {
      sectionId: over.sectionId,
      index: sectionEnd(present, over.sectionId),
      role: over.role,
    }
  }
  if (over.source === 'block') {
    return { sectionId: over.sectionId, index: over.index, role: over.role }
  }
  if (over.source === 'section') {
    return {
      sectionId: over.sectionId,
      index: sectionEnd(present, over.sectionId),
    }
  }
  return null
}

export function resolveDragEnd(
  event: DragEndEvent,
  present: SkeletonSchema,
): DraftAction | null {
  const active = event.active.data.current as DragData | undefined
  const over = event.over?.data.current as DragData | undefined
  if (!active || !over) return null

  if (active.source === 'palette') {
    const target = resolveDropTarget(over, present)
    if (!target) return null
    const block = createDefaultBlock(
      active.blockType,
      target.role,
      active.chartType,
    )
    return {
      type: 'addBlock',
      sectionId: target.sectionId,
      block,
      index: target.index,
    }
  }

  if (active.source === 'block') {
    const target = resolveDropTarget(over, present)
    if (!target) return null
    if (target.sectionId === active.sectionId && target.index === active.index)
      return null
    return {
      type: 'moveBlock',
      from: { sectionId: active.sectionId, index: active.index },
      to: {
        sectionId: target.sectionId,
        index: target.index,
        role: target.role,
      },
    }
  }

  if (active.source === 'section' && over.source === 'section') {
    if (active.index === over.index) return null
    return { type: 'reorderSection', from: active.index, to: over.index }
  }

  return null
}
