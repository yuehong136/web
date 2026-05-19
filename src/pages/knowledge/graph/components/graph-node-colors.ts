import type { CSSProperties } from 'react'
import { NODE_TYPE_PALETTE, NODE_TYPE_PALETTE_DARK } from '../constants'

export function buildTypeColorMap(types: string[], isDark: boolean) {
  const palette = isDark ? NODE_TYPE_PALETTE_DARK : NODE_TYPE_PALETTE
  const map: Record<string, string> = {}
  types.forEach((type, index) => {
    map[type] = palette[index % palette.length]
  })
  return map
}

export function getTypeColor(type: string): string {
  const hash = type.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return NODE_TYPE_PALETTE[hash % NODE_TYPE_PALETTE.length]
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
