import type { KnowledgeGraph } from '@/types/api'
import { LayoutMode } from './types'
import { buildCombosFromCommunities, spreadInitialPositions } from './utils'

export function buildGraphRenderData(
  data: KnowledgeGraph,
  layoutMode: LayoutMode,
) {
  const positionSeed = data.nodes.map((node) => node.id).join('\u001f')
  const positions = spreadInitialPositions(data.nodes.length, positionSeed)

  const baseNodes = data.nodes.map((node, index) => ({
    id: node.id,
    data: {
      label: node.label,
      entityType: node.type,
      properties: node.properties,
      rank: node.properties?.rank ?? node.properties?.weight ?? 1,
      communities: node.properties?.communities,
      x: positions[index].x,
      y: positions[index].y,
    },
  }))

  const edges = data.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    data: {
      label: edge.label,
      weight: edge.properties?.weight ?? 1,
      properties: edge.properties,
    },
  }))

  if (layoutMode === LayoutMode.COMBO) {
    const { nodes, combos } = buildCombosFromCommunities(baseNodes)
    return { nodes, edges, combos }
  }

  return { nodes: baseNodes, edges }
}
