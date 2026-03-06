export const NODE_TYPE_PALETTE = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f43f5e', // rose
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
] as const

export const NODE_TYPE_PALETTE_DARK = [
  '#818cf8',
  '#a78bfa',
  '#f472b6',
  '#fb7185',
  '#fb923c',
  '#facc15',
  '#4ade80',
  '#2dd4bf',
  '#22d3ee',
  '#60a5fa',
] as const

export const DEFAULT_COMBO_LABEL = 'defaultCombo'

export const COMBO_LAYOUT_CONFIG = {
  type: 'combo-combined',
  preventOverlap: true,
  comboPadding: 2,
  spacing: 80,
  nodeSize: 60,
}

export const FORCE_LAYOUT_CONFIG = {
  type: 'd3-force' as const,
  iterations: 300,
  alphaDecay: 0.02,
  alphaMin: 0.001,
  manyBody: {
    strength: -400,
    distanceMax: 800,
  },
  center: {
    x: 0,
    y: 0,
    strength: 0.05,
  },
  collide: {
    radius: 40,
    strength: 0.7,
    iterations: 3,
  },
  link: {
    distance: 200,
    strength: 0.3,
  },
}
