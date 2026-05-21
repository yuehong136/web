import type { KnowledgeGraph } from '@/types/api'
import type { ComboData } from '@antv/g6'
import { DEFAULT_COMBO_LABEL } from './constants'
import { LayoutMode } from './types'

/**
 * Detect whether community data exists in the graph nodes.
 */
export function detectLayoutMode(data: KnowledgeGraph): LayoutMode {
  const hasCommunities = data.nodes.some((n) => {
    const communities = n.properties?.communities
    return Array.isArray(communities) && communities.length > 0
  })
  return hasCommunities ? LayoutMode.COMBO : LayoutMode.FORCE
}

/**
 * Build combo data from node communities.
 * Groups nodes by their first community label, creates a ComboData per unique community.
 */
export function buildCombosFromCommunities(
  nodes: Array<{ id: string; data: Record<string, unknown> }>,
): {
  nodes: Array<{ id: string; combo?: string; data: Record<string, unknown> }>
  combos: ComboData[]
} {
  const comboMap = new Map<string, string>()
  let comboIndex = 0

  for (const node of nodes) {
    const communities = node.data?.communities as string[] | undefined
    const community = Array.isArray(communities) ? communities[0] : undefined
    if (community && !comboMap.has(community)) {
      comboMap.set(community, `combo-${comboIndex++}`)
    }
  }

  const combos: ComboData[] = Array.from(comboMap.entries()).map(
    ([label, id]) => ({ id, data: { label } }),
  )

  if (combos.length === 0) {
    combos.push({ id: 'combo-default', data: { label: DEFAULT_COMBO_LABEL } })
  }

  const mappedNodes = nodes.map((node) => {
    const communities = node.data?.communities as string[] | undefined
    const community = Array.isArray(communities) ? communities[0] : undefined
    const comboId = community ? comboMap.get(community) : undefined
    return { ...node, combo: comboId }
  })

  return { nodes: mappedNodes, combos }
}

function hashSeed(seed: string | number): number {
  const value = String(seed)
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Assign deterministic initial positions spread in a circle with jitter.
 * Prevents all nodes starting at (0,0) without making refreshes drift.
 */
export function spreadInitialPositions(
  nodeCount: number,
  seed: string | number = 'knowledge-graph',
): Array<{ x: number; y: number }> {
  if (nodeCount <= 0) return []

  const radius = Math.max(150, Math.sqrt(nodeCount) * 60)
  const random = mulberry32(hashSeed(seed))

  return Array.from({ length: nodeCount }, (_, i) => {
    const angle = (2 * Math.PI * i) / nodeCount
    const jitter = (random() - 0.5) * radius * 0.3
    return {
      x: Math.cos(angle) * radius + jitter,
      y: Math.sin(angle) * radius + jitter,
    }
  })
}
