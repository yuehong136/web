/**
 * HTMLReport 类型契约。
 *
 * 两套 schema：
 * - {@link ReportSchema} —— 运行时渲染器（`renderer/build-report-html`）的输入；
 *   字段命名与参考项目 `ai-report-renderer/src/types/report-schema.ts` 保持一致，
 *   便于跨项目（datav 消费端）复用同一契约。
 * - {@link SkeletonSchema} —— 设计时用户在 Designer 中编排的骨架；运行时经
 *   `schema-fill`（补叶子值 + 确定性 merge）转换为 {@link ReportSchema}。
 *
 * 见 `docs/html-report/README.md` 的「数据契约」一节。
 */

// ============================================================
// 主题
// ============================================================

export interface ThemeConfig {
  /** 图表调色板，按顺序使用 */
  colorPalette?: string[]
}

// ============================================================
// ReportSchema（运行时 · 渲染器输入）
// ============================================================

export interface ReportSchema {
  title: string
  /** Hero 顶部的 eyebrow 药丸/导语小标（如「2025 年度报告」），可选 */
  eyebrow?: string
  /** 报告副标题（Hero 大标题下方一行），可选 */
  subtitle?: string
  /** 报告日期，格式 YYYY-MM-DD */
  date?: string
  /** 报告作者/来源 */
  author?: string
  /** Hero 头图 slug（命中 renderer/header-art 的 HEADER_ARTWORKS 才出图，否则纯文字 Hero） */
  headerArt?: string
  /** 头图与文字的排布；仅 headerArt 命中时生效，缺省 'band'（横幅在上） */
  headerLayout?: HeaderLayout
  theme?: ThemeConfig
  sections: Section[]
}

export interface Section {
  id: string
  title?: string
  subtitle?: string
  layout: LayoutType
  /** 内容块数组，顺序对应布局中的位置 */
  blocks: Block[]
}

/**
 * 布局原语：
 * - full:          通栏，单列
 * - two-column:    左右等分（1:1）
 * - three-column:  三等分（1:1:1）
 * - sidebar-left:  左窄右宽（1:2）
 * - sidebar-right: 左宽右窄（2:1）
 */
export type LayoutType =
  | 'full'
  | 'two-column'
  | 'three-column'
  | 'sidebar-left'
  | 'sidebar-right'

/**
 * Hero 头图与文字的排布（仅 headerArt 命中时生效）：
 * - card:    图文卡——整块圆角卡，文字在左、头图融入右侧出血（要求素材左侧留白）
 * - band:    横幅在上、文字在下（最稳，图纯装饰）
 * - cover:   文字压在图上 + 底部渐变压暗（封面式）
 * - split:   左文右图分栏
 * - frosted: 满幅背景图 + 文字毛玻璃卡
 */
export type HeaderLayout = 'card' | 'band' | 'cover' | 'split' | 'frosted'

/** sidebar 布局中的位置角色；非 sidebar 布局时可省略 */
export type BlockRole = 'main' | 'side'

// ============================================================
// Block（内容块）
// ============================================================

/**
 * 所有 Block 的判别联合。渲染器通过 `type` 字段分发。
 */
export type Block =
  | HeadingBlock
  | ParagraphBlock
  | CalloutBlock
  | ListBlock
  | StatCardBlock
  | StatCardGroupBlock
  | TableBlock
  | ComparisonMatrixBlock
  | TimelineBlock
  | ChartBlock

interface BlockBase {
  id: string
  type: string
  role?: BlockRole
}

export interface HeadingBlock extends BlockBase {
  type: 'heading'
  /** 标题层级：1=大标题, 2=中标题, 3=小标题 */
  level: 1 | 2 | 3
  content: string
}

export interface ParagraphBlock extends BlockBase {
  type: 'paragraph'
  /** 支持简单 Markdown（加粗、斜体、行内代码） */
  content: string
}

export interface CalloutBlock extends BlockBase {
  type: 'callout'
  variant?: 'info' | 'success' | 'warning' | 'insight'
  title?: string
  content: string
}

export interface ListBlock extends BlockBase {
  type: 'list'
  /** true=有序列表, false=无序列表 */
  ordered: boolean
  title?: string
  items: string[]
}

export interface StatCardBlock extends BlockBase {
  type: 'stat-card'
  label: string
  /** 指标数值（已格式化的字符串） */
  value: string
  /** 变化量/变化率，如 "+12%" "-5%" */
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  description?: string
  /**
   * 指标卡左上角图标名（内置内联 SVG 集，见 `renderer/icons.ts`）。可选；
   * 缺省时渲染器按 label 关键词启发式自动挑图标。
   */
  icon?: string
}

/** 多个 KPI 卡片，内部自动等分排列 */
export interface StatCardGroupBlock extends BlockBase {
  type: 'stat-card-group'
  items: StatCardData[]
}

/** stat-card 的数据部分（用于卡组的 items；不含 id/type/role） */
export type StatCardData = Omit<StatCardBlock, 'id' | 'type' | 'role'>

export interface TableBlock extends BlockBase {
  type: 'table'
  title?: string
  headers: string[]
  /** 行数据，每行与 headers 一一对应 */
  rows: string[][]
}

export interface ComparisonMatrixBlock extends BlockBase {
  type: 'comparison-matrix'
  title?: string
  /** 被对比的对象（列头） */
  items: string[]
  /** 对比维度（行） */
  criteria: ComparisonCriterion[]
}

export interface ComparisonCriterion {
  name: string
  /** 每个对象在该维度的值，顺序与 items 一一对应 */
  values: string[]
}

export interface TimelineBlock extends BlockBase {
  type: 'timeline'
  title?: string
  items: TimelineItem[]
}

export interface TimelineItem {
  /** 时间标签，如 "2024-01"、"Q1"、"第一阶段" */
  date: string
  title: string
  description?: string
}

/**
 * 统一图表 Block。不同 chartType 使用不同字段组合：
 *
 * | chartType     | 必填字段                  |
 * |---------------|---------------------------|
 * | bar/line/area | data, xAxisKey, series    |
 * | pie/donut     | data, nameKey, valueKey   |
 * | radar         | data, radarKeys, series   |
 * | funnel        | data, nameKey, valueKey   |
 * | scatter       | data, series(含 xKey/yKey)|
 */
export interface ChartBlock extends BlockBase {
  type: 'chart'
  chartType: ChartType
  title?: string
  /** 图表数据（行对象） */
  data: ChartDatum[]

  // ---- 笛卡尔坐标系（bar / line / area）----
  xAxisKey?: string
  yAxisLabel?: string
  series?: ChartSeries[]

  // ---- 占比类（pie / donut / funnel）----
  nameKey?: string
  valueKey?: string

  // ---- 雷达（radar）----
  radarKeys?: string[]
}

export type ChartType =
  | 'bar'
  | 'line'
  | 'area'
  | 'pie'
  | 'donut'
  | 'radar'
  | 'funnel'
  | 'scatter'

export type ChartDatum = Record<string, string | number>

export interface ChartSeries {
  /** 数据中对应的字段名 */
  dataKey: string
  /** 系列显示名称 */
  name?: string
  /** 颜色覆盖（不指定则从调色板取） */
  color?: string
  // ---- 散点图专用 ----
  xKey?: string
  yKey?: string
}

/** 任意 Block 的数据部分（去掉身份字段），用于骨架 `fields` 的弱类型承载 */
export type BlockData = Omit<Block, 'id' | 'role'>

// ============================================================
// SkeletonSchema（设计时 · Designer 编排）
// ============================================================

export interface SkeletonSchema {
  title: string
  /** Hero eyebrow 药丸/导语小标（设计器静态填）；运行时经 mergeSkeleton 透传到 ReportSchema */
  eyebrow?: string
  /** 报告副标题（设计器静态填）；运行时经 mergeSkeleton 透传到 ReportSchema */
  subtitle?: string
  /** Hero 头图 slug（设计器手选；命中 renderer/header-art 才出图）；经 mergeSkeleton 透传 */
  headerArt?: string
  /** 头图排布（设计器手选）；仅 headerArt 命中时生效，经 mergeSkeleton 透传 */
  headerLayout?: HeaderLayout
  /** 标题填充指令:缺省/static=用 title 字符串;llm=运行时按源文生成 */
  titleDirective?: FieldDirective
  /**
   * 布局优先骨架标记(由「布局优先」生成置 true)。运行时据此:展开按新源文重建框架标签、
   * 默认标题模型态、空块/空节收缩。换主题套同版式的开关。
   */
  layoutFirst?: boolean
  theme?: ThemeConfig
  sections: SkeletonSection[]
}

export interface SkeletonSection {
  id: string
  title?: string
  subtitle?: string
  /** 小节标题填充指令：缺省/static=用 title 字符串；llm=运行时按源文重生成（跨主题重命名） */
  titleDirective?: FieldDirective
  layout: LayoutType
  blocks: SkeletonBlock[]
  /** 整段语义注解，拼进 LLM prompt，作用于该 Section 内所有 llm 字段 */
  annotation?: string
}

export interface SkeletonBlock {
  id: string
  /** 具体类型，MVP 必填（已砍掉 allowedTypes） */
  type: BlockKind
  /** sidebar 布局下的位置角色 */
  role?: BlockRole
  /** 用户已配置/钉死的字段值（强控制模式下大部分结构在此） */
  fields?: Partial<BlockData>
  /**
   * 字段级填充指令：字段路径 → 谁来填。未列出的字段默认视为 static。
   * 字段路径用点/方括号寻址，如 'value' / 'items[0].value' / 'data'。
   */
  fieldDirectives?: Record<string, FieldDirective>
  /**
   * Block 级语义注解，拼进 prompt，作用于该 Block 内所有 llm 字段。
   * 对生成区(type==='open-region')而言，此字段即它的 brief（描述这块讲什么 + 用什么组件）。
   */
  annotation?: string
}

export interface FieldDirective {
  mode: FieldMode
  /** mode==='variable' 时的上游引用，如 "{node_X.output.kpi}" */
  ref?: string
  /** mode==='llm' 时给该字段的自然语言提示（覆盖/细化 Block 级 annotation） */
  hint?: string
}

export type FieldMode = 'static' | 'variable' | 'llm'

/**
 * Block 的 `type` 取值集合（判别联合里所有 `type` 字面量）+ `'open-region'`。
 *
 * `'open-region'`（生成区）是**设计时占位**:用户只摆位置 + 写 brief(存于
 * `SkeletonBlock.annotation`),由模型在运行时按 brief 展开成真块。它只活在
 * {@link SkeletonSchema},运行前必被 `expandOpenRegions` 展开、预览时必被替身,
 * 绝不进 {@link ReportSchema}/渲染器(故不在 {@link Block} 联合里)。
 */
export type BlockKind = Block['type'] | 'open-region'

/** 生成区占位块的 type 字面量。 */
export const OPEN_REGION = 'open-region'

/** 是否为生成区占位块。 */
export function isOpenRegion(block: SkeletonBlock): boolean {
  return block.type === OPEN_REGION
}
