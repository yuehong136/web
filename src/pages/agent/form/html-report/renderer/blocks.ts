/**
 * 9 种文本/数据 Block → HTML 字符串片段。纯函数，零 React/DOM 依赖。
 *
 * 约束（决策 #7 渲染端例外）：只能用 `renderer/styles.tsx` 定义的 `.rpt-*`
 * class / `--rpt-*` CSS Variables，**不能用主应用 Tailwind / 语义 token**，
 * 以便报告脱离主应用单独离线展示。
 *
 * 图表（chart）只在此产出挂载容器；ECharts 的 `init/setOption` 由
 * `build-report-html` 统一注入（见 {@link chartMountId}）。
 */
import type {
  Block,
  CalloutBlock,
  ChartBlock,
  ComparisonMatrixBlock,
  HeadingBlock,
  ListBlock,
  ParagraphBlock,
  StatCardData,
  StatCardBlock,
  StatCardGroupBlock,
  TableBlock,
  TimelineBlock,
} from '../types'
import { ICON_SVGS, pickIconByLabel, renderStatIcon } from './icons'

// ============================================================
// 文本转义 / 极简行内 Markdown
// ============================================================

/** HTML 文本转义，阻断注入。所有进入 HTML 的用户/LLM 文本都过它。 */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * 极简行内 Markdown：先整体转义，再还原 `**粗**` / `*斜*` / `` `码` ``。
 * 仅用于 paragraph，故意不支持块级语法。
 */
export function inlineMarkdown(value: string): string {
  const escaped = escapeHtml(value)
  return escaped
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
}

// ============================================================
// 图表挂载点约定
// ============================================================

/**
 * 图表挂载容器 id。由 block.id 确定性派生，`build-report-html` 据此注入
 * `echarts.init(...).setOption(...)`，无需 blocks.ts 回传任何东西。
 */
export function chartMountId(blockId: string): string {
  return `rpt-chart-${blockId}`
}

// ============================================================
// 各 Block 渲染
// ============================================================

function renderHeading(b: HeadingBlock): string {
  const level = b.level === 1 || b.level === 2 || b.level === 3 ? b.level : 2
  return `<div class="rpt-heading rpt-heading--${level}">${escapeHtml(b.content)}</div>`
}

function renderParagraph(b: ParagraphBlock): string {
  return `<p class="rpt-paragraph">${inlineMarkdown(b.content ?? '')}</p>`
}

function renderCallout(b: CalloutBlock): string {
  const variant = b.variant ?? 'info'
  const modifier = variant === 'info' ? '' : ` rpt-callout--${variant}`
  const title = b.title
    ? `<p class="rpt-callout__title">${escapeHtml(b.title)}</p>`
    : ''
  return `<div class="rpt-callout${modifier}">${title}<p class="rpt-callout__content">${inlineMarkdown(
    b.content ?? '',
  )}</p></div>`
}

function renderList(b: ListBlock): string {
  const tag = b.ordered ? 'ol' : 'ul'
  const title = b.title
    ? `<p class="rpt-list__title">${escapeHtml(b.title)}</p>`
    : ''
  const items = (b.items ?? [])
    .map((item) => `<li>${inlineMarkdown(item)}</li>`)
    .join('')
  return `<div class="rpt-list rpt-card">${title}<${tag}>${items}</${tag}></div>`
}

/** accent: 1..5 的着色槽（按卡序轮转，决定图标圆与强调色） */
function renderStatCardInner(card: StatCardData, accent: number): string {
  const iconName =
    card.icon && ICON_SVGS[card.icon] ? card.icon : pickIconByLabel(card.label)
  const icon = renderStatIcon(iconName, accent)
  const trend = card.trend ?? 'neutral'
  const change = card.change
    ? `<span class="rpt-stat-card__change rpt-stat-card__change--${trend}">${escapeHtml(
        card.change,
      )}</span>`
    : ''
  const description = card.description
    ? `<div class="rpt-stat-card__description">${escapeHtml(card.description)}</div>`
    : ''
  return (
    icon +
    `<div class="rpt-stat-card__label">${escapeHtml(card.label)}</div>` +
    `<div class="rpt-stat-card__value-row">` +
    `<span class="rpt-stat-card__value">${escapeHtml(card.value)}</span>${change}` +
    `</div>${description}`
  )
}

function renderStatCard(b: StatCardBlock): string {
  return `<div class="rpt-stat-card">${renderStatCardInner(b, 1)}</div>`
}

function renderStatCardGroup(b: StatCardGroupBlock): string {
  const cards = (b.items ?? [])
    .map(
      (card, i) =>
        `<div class="rpt-stat-card">${renderStatCardInner(card, (i % 5) + 1)}</div>`,
    )
    .join('')
  return `<div class="rpt-stat-card-group">${cards}</div>`
}

function renderTable(b: TableBlock): string {
  const title = b.title
    ? `<p class="rpt-table__title">${escapeHtml(b.title)}</p>`
    : ''
  const head = `<thead><tr>${(b.headers ?? [])
    .map((h) => `<th>${escapeHtml(h)}</th>`)
    .join('')}</tr></thead>`
  const body = `<tbody>${(b.rows ?? [])
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`,
    )
    .join('')}</tbody>`
  return `<div class="rpt-card">${title}<table class="rpt-table">${head}${body}</table></div>`
}

function renderComparisonMatrix(b: ComparisonMatrixBlock): string {
  const title = b.title
    ? `<p class="rpt-matrix__title">${escapeHtml(b.title)}</p>`
    : ''
  const head = `<thead><tr><th></th>${(b.items ?? [])
    .map((item) => `<th>${escapeHtml(item)}</th>`)
    .join('')}</tr></thead>`
  const body = `<tbody>${(b.criteria ?? [])
    .map(
      (c) =>
        `<tr><th>${escapeHtml(c.name)}</th>${(c.values ?? [])
          .map((v) => `<td>${escapeHtml(v)}</td>`)
          .join('')}</tr>`,
    )
    .join('')}</tbody>`
  return `<div class="rpt-card">${title}<table class="rpt-matrix">${head}${body}</table></div>`
}

function renderTimeline(b: TimelineBlock): string {
  const title = b.title
    ? `<p class="rpt-timeline__title">${escapeHtml(b.title)}</p>`
    : ''
  const items = (b.items ?? [])
    .map(
      (item) =>
        `<li class="rpt-timeline__item">` +
        `<span class="rpt-timeline__dot"></span>` +
        `<div class="rpt-timeline__date">${escapeHtml(item.date)}</div>` +
        `<div class="rpt-timeline__heading">${escapeHtml(item.title)}</div>` +
        (item.description
          ? `<p class="rpt-timeline__desc">${escapeHtml(item.description)}</p>`
          : '') +
        `</li>`,
    )
    .join('')
  return `<div class="rpt-timeline rpt-card">${title}<ul class="rpt-timeline__list">${items}</ul></div>`
}

function renderChart(b: ChartBlock): string {
  const title = b.title
    ? `<p class="rpt-chart__title">${escapeHtml(b.title)}</p>`
    : ''
  // 仅挂载点；ECharts init/setOption 由 build-report-html 注入。
  return `<div class="rpt-chart rpt-card">${title}<div id="${chartMountId(
    b.id,
  )}" class="rpt-chart__canvas"></div></div>`
}

// ============================================================
// 分发
// ============================================================

/** 单个 Block → HTML 字符串片段。 */
export function renderBlock(block: Block): string {
  switch (block.type) {
    case 'heading':
      return renderHeading(block)
    case 'paragraph':
      return renderParagraph(block)
    case 'callout':
      return renderCallout(block)
    case 'list':
      return renderList(block)
    case 'stat-card':
      return renderStatCard(block)
    case 'stat-card-group':
      return renderStatCardGroup(block)
    case 'table':
      return renderTable(block)
    case 'comparison-matrix':
      return renderComparisonMatrix(block)
    case 'timeline':
      return renderTimeline(block)
    case 'chart':
      return renderChart(block)
    default: {
      // 穷尽性检查：新增 Block 类型时这里会编译报错
      const _exhaustive: never = block
      return _exhaustive
    }
  }
}
