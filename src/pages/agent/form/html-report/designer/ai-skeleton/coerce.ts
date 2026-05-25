/**
 * `parse.ts` 用的低层强转 + 合法取值集合。从 parse.ts 拆出以控行数。
 * 都是纯函数/常量,不依赖骨架结构本身。
 */
import type { BlockKind, ChartType, LayoutType } from '../../types'

export type Dict = Record<string, unknown>
export type Fields = Record<string, unknown>

export const isObj = (v: unknown): v is Dict =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
export const str = (v: unknown, fallback = ''): string =>
  typeof v === 'string' ? v : v == null ? fallback : String(v)
export const optStr = (v: unknown): string | undefined =>
  typeof v === 'string' && v.length > 0 ? v : undefined
export const strArr = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => str(x)) : []
export const oneOf = <T extends string>(
  v: unknown,
  allowed: readonly T[],
  fallback: T,
): T =>
  typeof v === 'string' && (allowed as readonly string[]).includes(v)
    ? (v as T)
    : fallback
export const optEnum = <T extends string>(
  v: unknown,
  allowed: readonly T[],
): T | undefined =>
  typeof v === 'string' && (allowed as readonly string[]).includes(v)
    ? (v as T)
    : undefined
export const level = (v: unknown): 1 | 2 | 3 =>
  v === 1 || v === '1' ? 1 : v === 3 || v === '3' ? 3 : 2

// ---- 合法取值(satisfies 保证与 types 的联合同步)----
export const LAYOUTS = [
  'full',
  'two-column',
  'three-column',
  'sidebar-left',
  'sidebar-right',
] as const satisfies readonly LayoutType[]
export const BLOCK_KINDS = [
  'heading',
  'paragraph',
  'callout',
  'list',
  'stat-card',
  'stat-card-group',
  'table',
  'comparison-matrix',
  'timeline',
  'chart',
] as const satisfies readonly BlockKind[]
export const CHART_TYPES = [
  'bar',
  'line',
  'area',
  'pie',
  'donut',
  'radar',
  'funnel',
  'scatter',
] as const satisfies readonly ChartType[]
export const VARIANTS = ['info', 'success', 'warning', 'insight'] as const
export const TRENDS = ['up', 'down', 'neutral'] as const
export const CARTESIAN = new Set<ChartType>(['bar', 'line', 'area'])
export const PROPORTION = new Set<ChartType>(['pie', 'donut', 'funnel'])
export const SIDEBAR = new Set<LayoutType>(['sidebar-left', 'sidebar-right'])
