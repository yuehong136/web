import type { CSSProperties } from 'react'
import {
  getCategoricalIndex,
  getCategoricalPalette,
  type ThemeMode,
} from '@/lib/design-tokens'

/**
 * 实体类型 → 分类色映射。画布（force-graph）与侧栏（node-detail）都走同一
 * deterministic `type → slot` 算法，确保同一类型在两处颜色一致。
 * 颜色来源是设计令牌 `data-viz-categorical-*` 的 typed JS 值，按当前主题取色。
 */
export function buildTypeColorMap(
  types: string[],
  theme: ThemeMode,
): Record<string, string> {
  const palette = getCategoricalPalette(theme)
  const map: Record<string, string> = {}
  types.forEach((type) => {
    map[type] = palette[getCategoricalIndex(type)]
  })
  return map
}

export function getTypeColor(type: string, theme: ThemeMode): string {
  const palette = getCategoricalPalette(theme)
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
