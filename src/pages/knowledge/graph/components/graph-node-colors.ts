import type { CSSProperties } from 'react'
import { getCategoricalIndex, getCategoricalPalette } from '@/lib/design-tokens'

/**
 * 实体类型 → 分类色映射。画布（force-graph）与侧栏（node-detail）都走同一
 * deterministic `type → slot` 算法，确保同一类型在两处颜色一致。
 * 颜色来源是设计令牌 `data-viz-categorical-*`（明暗自动切换）。
 */
export function buildTypeColorMap(
  types: string[],
  element?: HTMLElement | null,
): Record<string, string> {
  const palette = getCategoricalPalette(element)
  const map: Record<string, string> = {}
  types.forEach((type) => {
    map[type] = palette[getCategoricalIndex(type)]
  })
  return map
}

export function getTypeColor(
  type: string,
  element?: HTMLElement | null,
): string {
  const palette = getCategoricalPalette(element)
  return palette[getCategoricalIndex(type)]
}

export function getNodeColorStyle(color: string): CSSProperties {
  return {
    backgroundColor: color,
  }
}

export function getNodeIconStyle(color: string): CSSProperties {
  return {
    color,
    fill: color,
  }
}
