/**
 * Section + 5 种 Layout → HTML 字符串。纯函数。
 *
 * grid 修饰类与 {@link LayoutType} 字面量一一对应（`.rpt-section__grid--full`
 * 等），样式见 `renderer/styles.tsx`。
 *
 * - full / two-column / three-column：Block 作为 grid 直接子项自动流入列。
 * - sidebar-left / sidebar-right：按 `role` 分「主(main, 宽列)」「侧(side, 窄列)」
 *   两个 grid 单元；窄列在 left/right 由布局决定先后（见 styles 的 1fr/2fr）。
 */
import type { Block, BlockRole, LayoutType, Section } from '../types'
import { renderBlock } from './blocks'

const SIDEBAR_LAYOUTS: ReadonlySet<LayoutType> = new Set([
  'sidebar-left',
  'sidebar-right',
])

function renderSectionHeader(section: Section): string {
  if (!section.title && !section.subtitle) return ''
  const title = section.title
    ? `<h2 class="rpt-section__title">${escapeText(section.title)}</h2>`
    : ''
  const subtitle = section.subtitle
    ? `<p class="rpt-section__subtitle">${escapeText(section.subtitle)}</p>`
    : ''
  return `<div class="rpt-section__header">${title}${subtitle}</div>`
}

/** Section 标题/副标题转义（与 blocks 同一规则，避免循环导入这里内联一份） */
function escapeText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function partitionByRole(blocks: Block[]): { main: Block[]; side: Block[] } {
  const main: Block[] = []
  const side: Block[] = []
  for (const block of blocks) {
    const role: BlockRole = block.role === 'side' ? 'side' : 'main'
    ;(role === 'side' ? side : main).push(block)
  }
  return { main, side }
}

function renderColumn(blocks: Block[]): string {
  return `<div>${blocks.map(renderBlock).join('')}</div>`
}

function renderGridBody(layout: LayoutType, blocks: Block[]): string {
  if (!SIDEBAR_LAYOUTS.has(layout)) {
    // grid 自动布列
    return blocks.map(renderBlock).join('')
  }
  const { main, side } = partitionByRole(blocks)
  const mainCol = renderColumn(main)
  const sideCol = renderColumn(side)
  // sidebar-left：窄(side)在左；sidebar-right：宽(main)在左
  return layout === 'sidebar-left' ? sideCol + mainCol : mainCol + sideCol
}

/** 单个 Section → HTML 字符串片段。 */
export function renderSection(section: Section): string {
  const header = renderSectionHeader(section)
  const grid = `<div class="rpt-section__grid rpt-section__grid--${section.layout}">${renderGridBody(
    section.layout,
    section.blocks ?? [],
  )}</div>`
  return `<section class="rpt-section">${header}${grid}</section>`
}
