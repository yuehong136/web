/** 块/图表/布局的展示标签(i18n key + 英文兜底),供画布、Palette、Inspector 共用。 */
import type {
  BlockKind,
  ChartBlock,
  ChartType,
  LayoutType,
  SkeletonBlock,
} from '../types'

interface Label {
  labelKey: string
  fallback: string
}

export const LAYOUT_LABEL: Record<LayoutType, Label> = {
  full: { labelKey: 'flow.htmlReportLayoutFull', fallback: 'Full width' },
  'two-column': {
    labelKey: 'flow.htmlReportLayoutTwoColumn',
    fallback: 'Two columns',
  },
  'three-column': {
    labelKey: 'flow.htmlReportLayoutThreeColumn',
    fallback: 'Three columns',
  },
  'sidebar-left': {
    labelKey: 'flow.htmlReportLayoutSidebarLeft',
    fallback: 'Sidebar left',
  },
  'sidebar-right': {
    labelKey: 'flow.htmlReportLayoutSidebarRight',
    fallback: 'Sidebar right',
  },
}

export const SIDEBAR_LAYOUTS: ReadonlySet<LayoutType> = new Set<LayoutType>([
  'sidebar-left',
  'sidebar-right',
])

export const BLOCK_LABEL: Record<BlockKind, Label> = {
  heading: { labelKey: 'flow.htmlReportBlockHeading', fallback: 'Heading' },
  paragraph: {
    labelKey: 'flow.htmlReportBlockParagraph',
    fallback: 'Paragraph',
  },
  callout: { labelKey: 'flow.htmlReportBlockCallout', fallback: 'Callout' },
  list: { labelKey: 'flow.htmlReportBlockList', fallback: 'List' },
  'stat-card': {
    labelKey: 'flow.htmlReportBlockStatCard',
    fallback: 'Stat card',
  },
  'stat-card-group': {
    labelKey: 'flow.htmlReportBlockStatCardGroup',
    fallback: 'Stat card group',
  },
  table: { labelKey: 'flow.htmlReportBlockTable', fallback: 'Table' },
  'comparison-matrix': {
    labelKey: 'flow.htmlReportBlockComparison',
    fallback: 'Comparison',
  },
  timeline: { labelKey: 'flow.htmlReportBlockTimeline', fallback: 'Timeline' },
  chart: { labelKey: 'flow.htmlReportBlockChart', fallback: 'Chart' },
}

/**
 * 显示「块级注解」的块:含列表/数组/整段数据的多槽块。标量单内容块(标题、段落、标注、
 * 单指标卡)不显示——其唯一内容字段的「模型」提示词即该块的说明,避免与注解重复。
 */
export const ANNOTATABLE_BLOCKS: ReadonlySet<BlockKind> = new Set<BlockKind>([
  'chart',
  'table',
  'comparison-matrix',
  'stat-card-group',
  'timeline',
  'list',
])

export const CHART_LABEL: Record<ChartType, Label> = {
  bar: { labelKey: 'flow.htmlReportChartBar', fallback: 'Bar' },
  line: { labelKey: 'flow.htmlReportChartLine', fallback: 'Line' },
  area: { labelKey: 'flow.htmlReportChartArea', fallback: 'Area' },
  pie: { labelKey: 'flow.htmlReportChartPie', fallback: 'Pie' },
  donut: { labelKey: 'flow.htmlReportChartDonut', fallback: 'Donut' },
  radar: { labelKey: 'flow.htmlReportChartRadar', fallback: 'Radar' },
  funnel: { labelKey: 'flow.htmlReportChartFunnel', fallback: 'Funnel' },
  scatter: { labelKey: 'flow.htmlReportChartScatter', fallback: 'Scatter' },
}

export function blockDisplayLabel(block: SkeletonBlock): Label {
  if (block.type === 'chart') {
    const chartType = (block.fields as Partial<ChartBlock> | undefined)
      ?.chartType
    if (chartType && CHART_LABEL[chartType]) return CHART_LABEL[chartType]
  }
  return BLOCK_LABEL[block.type]
}
