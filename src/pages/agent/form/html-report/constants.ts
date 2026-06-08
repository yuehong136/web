/**
 * HTMLReport 常量。
 *
 * 枚举值刻意等于 {@link ./types} 里判别联合的 `type`/`layout` 字面量，
 * 让设计时代码（Palette、Inspector）用枚举、运行时契约用字面量，二者对齐。
 */
import type { SkeletonSchema, ThemeConfig } from './types'

// ============================================================
// 尺寸（renderer/styles.tsx 直接引用）
// ============================================================

/** 报告正文容器最大宽度（px） */
export const REPORT_CONTENT_WIDTH = 960

/** 图表画布的逻辑宽度（px，CSS 上以 max-width:100% 自适应） */
export const CHART_WIDTH = 720

/** 图表画布高度（px） */
export const CHART_HEIGHT = 320

// ============================================================
// Block 类型
// ============================================================

export enum BlockType {
  Heading = 'heading',
  Paragraph = 'paragraph',
  Callout = 'callout',
  List = 'list',
  StatCard = 'stat-card',
  StatCardGroup = 'stat-card-group',
  Table = 'table',
  ComparisonMatrix = 'comparison-matrix',
  Timeline = 'timeline',
  Chart = 'chart',
}

/** 渲染/Palette 遍历用的稳定顺序 */
export const BLOCK_TYPES: BlockType[] = [
  BlockType.Heading,
  BlockType.Paragraph,
  BlockType.Callout,
  BlockType.List,
  BlockType.StatCard,
  BlockType.StatCardGroup,
  BlockType.Table,
  BlockType.ComparisonMatrix,
  BlockType.Timeline,
  BlockType.Chart,
]

// ============================================================
// Layout
// ============================================================

export enum Layout {
  Full = 'full',
  TwoColumn = 'two-column',
  ThreeColumn = 'three-column',
  SidebarLeft = 'sidebar-left',
  SidebarRight = 'sidebar-right',
}

export const LAYOUT_TYPES: Layout[] = [
  Layout.Full,
  Layout.TwoColumn,
  Layout.ThreeColumn,
  Layout.SidebarLeft,
  Layout.SidebarRight,
]

/** 需要为每个 Block 标注 role(main/side) 的布局 */
export const SIDEBAR_LAYOUTS: ReadonlySet<Layout> = new Set([
  Layout.SidebarLeft,
  Layout.SidebarRight,
])

// ============================================================
// Chart
// ============================================================

export enum ChartKind {
  Bar = 'bar',
  Line = 'line',
  Area = 'area',
  Pie = 'pie',
  Donut = 'donut',
  Radar = 'radar',
  Funnel = 'funnel',
  Scatter = 'scatter',
}

export const CHART_TYPES: ChartKind[] = [
  ChartKind.Bar,
  ChartKind.Line,
  ChartKind.Area,
  ChartKind.Pie,
  ChartKind.Donut,
  ChartKind.Radar,
  ChartKind.Funnel,
  ChartKind.Scatter,
]

/** 笛卡尔坐标系图表（用 xAxisKey + series） */
export const CARTESIAN_CHARTS: ReadonlySet<ChartKind> = new Set([
  ChartKind.Bar,
  ChartKind.Line,
  ChartKind.Area,
])

/** 占比类图表（用 nameKey + valueKey） */
export const PROPORTION_CHARTS: ReadonlySet<ChartKind> = new Set([
  ChartKind.Pie,
  ChartKind.Donut,
  ChartKind.Funnel,
])

// ============================================================
// 字段填充模式
// ============================================================

export enum FieldModeKind {
  Static = 'static',
  Variable = 'variable',
  Llm = 'llm',
}

// ============================================================
// 默认主题
// ============================================================

export const DEFAULT_THEME: Required<ThemeConfig> = {
  colorPalette: ['#1677ff', '#36cfc9', '#ffc53d', '#ff7a45', '#9254de'],
}

// ============================================================
// 算子节点初始值
// ============================================================

/** 默认温度（与多数 chat 算子一致的低发散取值） */
export const DEFAULT_TEMPERATURE = 0.1

/** 默认填充并发上限（与后端 report_fill.DEFAULT_FILL_CONCURRENCY 对齐） */
export const DEFAULT_FILL_CONCURRENCY = 4

/**
 * HTMLReport 节点的表单初始值。
 *
 * 节点持久化的是设计时 {@link SkeletonSchema}（骨架 + 字段填充指令），体积仅几 KB；
 * 运行时由后端按指令补值得到 ReportSchema，消费端再拼成自包含 HTML（决策 #29/#30）。
 * 放在本文件而非 `constant/index.ts`，避免后者（已 1400+ 行）继续膨胀。
 *
 * 运行期输入(给后端的契约，沿用全仓约定字段名)：
 * - `query`：源料的上游变量引用，运行时填充报告所据的内容。
 * - `llm_id`：填充用 chat 模型（`name@provider` 形式）。
 * - `temperature`：生成温度。
 * - `parallel_fill`：是否并行填充各小节（默认开，提速；关则逐节串行）。
 * - `fill_concurrency`：并行时的并发上限（同时在飞的模型调用数）。
 */
export const initialHTMLReportValues = {
  skeleton: {
    title: '',
    sections: [],
    theme: DEFAULT_THEME,
  } satisfies SkeletonSchema,
  query: '',
  llm_id: '',
  temperature: DEFAULT_TEMPERATURE,
  parallel_fill: true,
  fill_concurrency: DEFAULT_FILL_CONCURRENCY,
  outputs: {} as Record<string, unknown>,
}
