// 节点实体类型分类色已收敛到设计令牌 `data-viz-categorical-1..10`（明暗自动切换），
// 通过 src/lib/design-tokens/getCategoricalPalette() 消费，不再在此硬编码 hex palette。
// 见 docs/design-tokens/2026-05-20-data-viz-palette-consolidation-summary.md。

import type { ComboCombinedLayoutOptions, D3ForceLayoutOptions } from '@antv/g6'

export const DEFAULT_COMBO_LABEL = 'defaultCombo'

export const COMBO_LAYOUT_CONFIG = {
  type: 'combo-combined',
  preventOverlap: true,
  comboPadding: 2,
  nodeSpacing: 80,
  nodeSize: 60,
} satisfies ComboCombinedLayoutOptions

export const FORCE_LAYOUT_CONFIG = {
  type: 'd3-force' as const,
  iterations: 300,
  alphaDecay: 0.02,
  alphaMin: 0.001,
  manyBody: {
    strength: -400,
    distanceMax: 800,
  },
  centerX: 0,
  centerY: 0,
  centerStrength: 0.05,
  collide: {
    radius: 40,
    strength: 0.7,
    iterations: 3,
  },
  link: {
    distance: 200,
    strength: 0.3,
  },
} satisfies D3ForceLayoutOptions
