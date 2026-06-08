/**
 * Designer 左栏:块/图表/布局目录。块与图表项可拖入画布,也可点击加到当前/末尾小节;
 * 布局项点击新增一个该布局的小节。
 */
import { useDraggable } from '@dnd-kit/core'
import { BarChart3, LayoutGrid, Sparkles, Table2, Type } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { PaletteDragData } from './dnd'
import type { BlockKind, ChartType, LayoutType } from '../types'

interface BlockItem {
  blockType: BlockKind
  chartType?: ChartType
  labelKey: string
  fallback: string
}

const TEXT_BLOCKS: BlockItem[] = [
  {
    blockType: 'heading',
    labelKey: 'flow.htmlReportBlockHeading',
    fallback: 'Heading',
  },
  {
    blockType: 'paragraph',
    labelKey: 'flow.htmlReportBlockParagraph',
    fallback: 'Paragraph',
  },
  {
    blockType: 'callout',
    labelKey: 'flow.htmlReportBlockCallout',
    fallback: 'Callout',
  },
  { blockType: 'list', labelKey: 'flow.htmlReportBlockList', fallback: 'List' },
]

const DATA_BLOCKS: BlockItem[] = [
  {
    blockType: 'stat-card',
    labelKey: 'flow.htmlReportBlockStatCard',
    fallback: 'Stat card',
  },
  {
    blockType: 'stat-card-group',
    labelKey: 'flow.htmlReportBlockStatCardGroup',
    fallback: 'Stat card group',
  },
  {
    blockType: 'table',
    labelKey: 'flow.htmlReportBlockTable',
    fallback: 'Table',
  },
  {
    blockType: 'comparison-matrix',
    labelKey: 'flow.htmlReportBlockComparison',
    fallback: 'Comparison',
  },
  {
    blockType: 'timeline',
    labelKey: 'flow.htmlReportBlockTimeline',
    fallback: 'Timeline',
  },
]

const CHART_BLOCKS: BlockItem[] = [
  {
    blockType: 'chart',
    chartType: 'bar',
    labelKey: 'flow.htmlReportChartBar',
    fallback: 'Bar',
  },
  {
    blockType: 'chart',
    chartType: 'line',
    labelKey: 'flow.htmlReportChartLine',
    fallback: 'Line',
  },
  {
    blockType: 'chart',
    chartType: 'area',
    labelKey: 'flow.htmlReportChartArea',
    fallback: 'Area',
  },
  {
    blockType: 'chart',
    chartType: 'pie',
    labelKey: 'flow.htmlReportChartPie',
    fallback: 'Pie',
  },
  {
    blockType: 'chart',
    chartType: 'donut',
    labelKey: 'flow.htmlReportChartDonut',
    fallback: 'Donut',
  },
  {
    blockType: 'chart',
    chartType: 'radar',
    labelKey: 'flow.htmlReportChartRadar',
    fallback: 'Radar',
  },
  {
    blockType: 'chart',
    chartType: 'funnel',
    labelKey: 'flow.htmlReportChartFunnel',
    fallback: 'Funnel',
  },
  {
    blockType: 'chart',
    chartType: 'scatter',
    labelKey: 'flow.htmlReportChartScatter',
    fallback: 'Scatter',
  },
]

// 生成区:不预设组件,由模型在运行时按 brief 生成(柔性、提示词驱动)。
const GENERATIVE_BLOCKS: BlockItem[] = [
  {
    blockType: 'open-region',
    labelKey: 'flow.htmlReportBlockOpenRegion',
    fallback: 'Generative region',
  },
]

const LAYOUTS: { layout: LayoutType; labelKey: string; fallback: string }[] = [
  {
    layout: 'full',
    labelKey: 'flow.htmlReportLayoutFull',
    fallback: 'Full width',
  },
  {
    layout: 'two-column',
    labelKey: 'flow.htmlReportLayoutTwoColumn',
    fallback: 'Two columns',
  },
  {
    layout: 'three-column',
    labelKey: 'flow.htmlReportLayoutThreeColumn',
    fallback: 'Three columns',
  },
  {
    layout: 'sidebar-left',
    labelKey: 'flow.htmlReportLayoutSidebarLeft',
    fallback: 'Sidebar left',
  },
  {
    layout: 'sidebar-right',
    labelKey: 'flow.htmlReportLayoutSidebarRight',
    fallback: 'Sidebar right',
  },
]

interface PaletteProps {
  onAddBlock: (blockType: BlockKind, chartType?: ChartType) => void
  onAddSection: (layout: LayoutType) => void
}

function PaletteChip({ item, onAdd }: { item: BlockItem; onAdd: () => void }) {
  const { t } = useTranslation()
  const dragId = `palette-${item.blockType}-${item.chartType ?? ''}`
  const data: PaletteDragData = {
    source: 'palette',
    blockType: item.blockType,
    chartType: item.chartType,
  }
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dragId,
    data,
  })

  return (
    <button
      type="button"
      ref={setNodeRef}
      onClick={onAdd}
      {...attributes}
      {...listeners}
      className={cn(
        'rounded-radius-md bg-surface-primary px-space-sm py-space-xs w-full cursor-grab border border-border-default text-left text-xs text-text-primary transition-colors hover:bg-state-hover active:cursor-grabbing',
        isDragging && 'opacity-50',
      )}
    >
      {t(item.labelKey, item.fallback)}
    </button>
  )
}

function PaletteGroup({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-space-xs">
      <div className="gap-space-xs text-text-caption flex items-center">
        {icon}
        <span className="text-xs font-medium">{title}</span>
      </div>
      <div className="gap-space-xs grid grid-cols-2">{children}</div>
    </div>
  )
}

export function Palette({ onAddBlock, onAddSection }: PaletteProps) {
  const { t } = useTranslation()
  return (
    <div className="gap-space-base p-space-sm flex h-full flex-col overflow-auto">
      <PaletteGroup
        icon={<Type className="size-icon-sm" />}
        title={t('flow.htmlReportGroupText', 'Text')}
      >
        {TEXT_BLOCKS.map((item) => (
          <PaletteChip
            key={item.blockType}
            item={item}
            onAdd={() => onAddBlock(item.blockType)}
          />
        ))}
      </PaletteGroup>

      <PaletteGroup
        icon={<Table2 className="size-icon-sm" />}
        title={t('flow.htmlReportGroupData', 'Data')}
      >
        {DATA_BLOCKS.map((item) => (
          <PaletteChip
            key={item.blockType}
            item={item}
            onAdd={() => onAddBlock(item.blockType)}
          />
        ))}
      </PaletteGroup>

      <PaletteGroup
        icon={<BarChart3 className="size-icon-sm" />}
        title={t('flow.htmlReportGroupChart', 'Chart')}
      >
        {CHART_BLOCKS.map((item) => (
          <PaletteChip
            key={item.chartType}
            item={item}
            onAdd={() => onAddBlock('chart', item.chartType)}
          />
        ))}
      </PaletteGroup>

      <PaletteGroup
        icon={<Sparkles className="size-icon-sm" />}
        title={t('flow.htmlReportGroupGenerative', 'Generative')}
      >
        {GENERATIVE_BLOCKS.map((item) => (
          <PaletteChip
            key={item.blockType}
            item={item}
            onAdd={() => onAddBlock(item.blockType)}
          />
        ))}
      </PaletteGroup>

      <PaletteGroup
        icon={<LayoutGrid className="size-icon-sm" />}
        title={t('flow.htmlReportGroupLayout', 'Layout')}
      >
        {LAYOUTS.map((item) => (
          <button
            key={item.layout}
            type="button"
            onClick={() => onAddSection(item.layout)}
            className="rounded-radius-md bg-surface-primary px-space-sm py-space-xs w-full border border-border-default text-left text-xs text-text-primary transition-colors hover:bg-state-hover"
          >
            {t(item.labelKey, item.fallback)}
          </button>
        ))}
      </PaletteGroup>
    </div>
  )
}
