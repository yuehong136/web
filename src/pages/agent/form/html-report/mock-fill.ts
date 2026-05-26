/**
 * 预览占位填充:把骨架里"待填"的字段用 mock 值补上,产出可直接渲染的 ReportSchema。
 * 不调用 LLM、不解析真实上游变量——纯用于 Designer 实时预览版式。
 *
 * 占位文案刻意用中性英文/数字(非产品 UI 文案,也非真实内容),既不需要 i18n,
 * 也避免在 `src/pages/agent` 引入硬编码中文。真实填充走 Phase 4 的 schema-fill,
 * 与本文件共用 {@link mergeSkeleton}。
 */
import { chartRowKeys, mergeSkeleton } from './skeleton-utils'
import { isOpenRegion } from './types'
import type {
  BlockData,
  ChartBlock,
  ChartDatum,
  ComparisonCriterion,
  ComparisonMatrixBlock,
  FieldDirective,
  ReportSchema,
  SkeletonBlock,
  SkeletonSchema,
  TableBlock,
} from './types'

const PREVIEW_ROW_COUNT = 5

// 预览替身文案:刻意用中性英文(同本文件其余占位),非产品 UI 文案。生成区的真展开走运行时。
const OPEN_REGION_PREVIEW =
  'Generative region — the model builds this at run time.'

/** 生成区在无模型预览里换成一个 callout 替身(展示 brief),避免产出畸形块。 */
function previewBlock(block: SkeletonBlock): SkeletonBlock {
  if (!isOpenRegion(block)) return block
  const brief = block.annotation?.trim()
  const next: SkeletonBlock = {
    id: block.id,
    type: 'callout',
    fields: {
      type: 'callout',
      variant: 'info',
      title: 'Generative region',
      content: brief
        ? `${OPEN_REGION_PREVIEW}\n\n${brief}`
        : OPEN_REGION_PREVIEW,
    } as Partial<BlockData>,
  }
  if (block.role) next.role = block.role
  return next
}

export function buildPreviewSchema(skeleton: SkeletonSchema): ReportSchema {
  const filledByBlock: Record<string, Record<string, unknown>> = {}

  // 先把生成区替换为 callout 替身;此后循环里不会再见到 open-region。
  const preview: SkeletonSchema = {
    ...skeleton,
    sections: skeleton.sections.map((section) => ({
      ...section,
      blocks: section.blocks.map(previewBlock),
    })),
  }

  for (const section of preview.sections) {
    for (const block of section.blocks) {
      const fills: Record<string, unknown> = {}
      for (const [path, directive] of Object.entries(
        block.fieldDirectives ?? {},
      )) {
        if (directive.mode === 'static') continue
        fills[path] = mockValue(block, path, directive)
      }
      // 图表即便未显式标 data 指令、也没钉死数据时,仍补样例行,避免预览出空图
      if (
        block.type === 'chart' &&
        fills.data === undefined &&
        staticChartData(block).length === 0
      ) {
        fills.data = mockChartRows(block)
      }
      filledByBlock[block.id] = fills
    }
  }

  return mergeSkeleton(preview, filledByBlock)
}

function mockValue(
  block: SkeletonBlock,
  path: string,
  directive: FieldDirective,
): unknown {
  // 数组型整段指令:按 Block 类型造结构化样例
  if (block.type === 'chart' && path === 'data') return mockChartRows(block)
  if (block.type === 'table' && path === 'rows') return mockTableRows(block)
  if (block.type === 'comparison-matrix' && path === 'criteria') {
    return mockCriteria(block)
  }
  if (block.type === 'list' && path === 'items') {
    return ['Sample item 1', 'Sample item 2', 'Sample item 3']
  }
  // 标量字段
  if (directive.mode === 'variable') {
    return directive.ref ? `{${directive.ref}}` : '{variable}'
  }
  // 语义枚举(模型模式):回落到合法枚举值。渲染端按值直接拼 class,不能灌 hint 文案。
  const leaf = path.split('.').pop() ?? path
  if (leaf === 'variant') return 'info'
  if (leaf === 'trend') return 'neutral'
  // llm:优先回显用户写的 hint(更直观),否则给中性占位
  return directive.hint?.trim() || placeholderFor(path)
}

function placeholderFor(path: string): string {
  const leaf = path.split('.').pop() ?? path
  if (leaf.includes('value')) return 'Sample value'
  if (leaf.includes('change')) return '+12%'
  if (leaf.includes('title')) return 'Sample title'
  if (leaf.includes('label')) return 'Sample label'
  if (leaf.includes('date')) return 'Q1'
  return 'Sample text'
}

function chartFields(block: SkeletonBlock): Partial<ChartBlock> {
  return (block.fields ?? {}) as Partial<ChartBlock>
}

function staticChartData(block: SkeletonBlock): ChartDatum[] {
  return chartFields(block).data ?? []
}

function mockChartRows(block: SkeletonBlock): ChartDatum[] {
  const { category, values } = chartRowKeys(block)
  const rows: ChartDatum[] = []
  for (let i = 0; i < PREVIEW_ROW_COUNT; i += 1) {
    const row: ChartDatum = { [category]: `Item ${i + 1}` }
    values.forEach((key, j) => {
      row[key] = (i + 1) * 20 + j * 7
    })
    rows.push(row)
  }
  return rows
}

function mockTableRows(block: SkeletonBlock): string[][] {
  const headers = ((block.fields ?? {}) as Partial<TableBlock>).headers ?? []
  const cols = Math.max(headers.length, 1)
  return Array.from({ length: 3 }, (_, r) =>
    Array.from({ length: cols }, (_, c) => `R${r + 1}C${c + 1}`),
  )
}

function mockCriteria(block: SkeletonBlock): ComparisonCriterion[] {
  const items =
    ((block.fields ?? {}) as Partial<ComparisonMatrixBlock>).items ?? []
  const cols = Math.max(items.length, 1)
  return Array.from({ length: 3 }, (_, r) => ({
    name: `Criterion ${r + 1}`,
    values: Array.from({ length: cols }, (_, c) => `V${r + 1}.${c + 1}`),
  }))
}
