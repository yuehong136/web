import { useMemo, useState, useCallback } from 'react'
import type { KnowledgeGraph } from '@/types/api'
import type { SelectedElement, GraphStats } from './types'

export function useGraphSelection(data: KnowledgeGraph | null) {
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null)

  const selectNode = useCallback(
    (nodeId: string) => {
      const nodes = data?.nodes ?? []
      const edges = data?.edges ?? []
      const node = nodes.find((n) => n.id === nodeId)
      if (!node) return

      const connectedEdges = edges.filter(
        (e) => e.source === nodeId || e.target === nodeId,
      )
      const neighborIds = new Set(
        connectedEdges.map((e) => (e.source === nodeId ? e.target : e.source)),
      )
      const neighbors = nodes.filter((n) => neighborIds.has(n.id))

      setSelectedElement({ type: 'node', data: node, neighbors, edges: connectedEdges })
    },
    [data],
  )

  const selectEdge = useCallback(
    (edgeId: string) => {
      const nodes = data?.nodes ?? []
      const edges = data?.edges ?? []
      const edge = edges.find((e) => e.id === edgeId)
      if (!edge) return

      const source = nodes.find((n) => n.id === edge.source)
      const target = nodes.find((n) => n.id === edge.target)

      setSelectedElement({ type: 'edge', data: edge, source, target })
    },
    [data],
  )

  const clearSelection = useCallback(() => setSelectedElement(null), [])

  return { selectedElement, selectNode, selectEdge, clearSelection }
}

export function useGraphStats(data: KnowledgeGraph | null): GraphStats {
  return useMemo(() => {
    const nodes = data?.nodes ?? []
    const edges = data?.edges ?? []
    const nodeTypes = [...new Set(nodes.map((n) => n.type).filter(Boolean))]
    return { nodeCount: nodes.length, edgeCount: edges.length, nodeTypes }
  }, [data])
}
