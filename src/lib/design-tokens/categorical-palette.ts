import { readCssVar } from './read-css-var'

/**
 * 分类/序列调色板 `data-viz-categorical-*` 的单一消费入口。
 *
 * 这是「分类/层级」着色（多色、无单一语义）的唯一来源 —— 图表、思维导图、知识图谱实体类型色都从此读取，
 * 不要再在页面/组件里硬编码 hex 数组。明暗主题切换由 CSS 变量自动负责，调用方无需区分 light/dark。
 * 语义状态色（done/failed/pending 等）请用 `components-system-chart-*`，不要混进 categorical。
 *
 * categorical 色不单独承载语义：分类识别仍需配合 label / tooltip / 文案（颜色非唯一信号）。
 */

export const CATEGORICAL_PALETTE_SIZE = 10

/** 静态字面量数组，使完整 token 名可被 grep / lint 检索（不要运行期拼接构造 token 名）。 */
export const DATA_VIZ_CATEGORICAL_TOKENS = [
  'data-viz-categorical-1',
  'data-viz-categorical-2',
  'data-viz-categorical-3',
  'data-viz-categorical-4',
  'data-viz-categorical-5',
  'data-viz-categorical-6',
  'data-viz-categorical-7',
  'data-viz-categorical-8',
  'data-viz-categorical-9',
  'data-viz-categorical-10',
] as const

/**
 * CSS 变量解析失败时的兜底（= 各档 light token 值，保证视觉与 token 一致）。
 * 仅在 SSR / token 名失效等异常路径生效；正常运行时读到的是实时 CSS 变量值。
 */
export const CATEGORICAL_FALLBACKS = [
  '#0ea5e9',
  '#10b981',
  '#00BEB4',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#f97316',
  '#3b82f6',
  '#84cc16',
] as const

/**
 * 读取分类调色板的实时颜色值（供 canvas / G6 等非 Tailwind 渲染器用）。
 * @param element 读取 CSS 变量的元素（默认 document.documentElement）；传入容器可支持 scoped-theme 子树。
 * @param count   返回的档位数（默认 10；mindmap 取 6）。
 */
export function getCategoricalPalette(
  element?: HTMLElement | null,
  count: number = CATEGORICAL_PALETTE_SIZE,
): string[] {
  const size = Math.min(count, CATEGORICAL_PALETTE_SIZE)
  return Array.from({ length: size }, (_, i) =>
    readCssVar(
      DATA_VIZ_CATEGORICAL_TOKENS[i],
      CATEGORICAL_FALLBACKS[i],
      element,
    ),
  )
}

/**
 * 把分类 key（如实体类型名）确定性地映射到调色板槽位。
 * 同一 key 始终得到同一槽位，使画布与侧栏等多处对同一类型着色一致。
 */
export function getCategoricalIndex(
  key: string,
  count: number = CATEGORICAL_PALETTE_SIZE,
): number {
  const size = Math.min(count, CATEGORICAL_PALETTE_SIZE)
  const hash = key.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return hash % size
}

/** 返回 `var(--color-data-viz-categorical-N)`，供 DOM `style` 直接引用（随主题切换）。 */
export function getCategoricalColorVar(index: number): string {
  const slot = (index % CATEGORICAL_PALETTE_SIZE) + 1
  return `var(--color-data-viz-categorical-${slot})`
}
