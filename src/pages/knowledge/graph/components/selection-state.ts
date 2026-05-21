import type { Graph } from '@antv/g6'

function hasNode(graph: Graph, nodeId: string | undefined): nodeId is string {
  if (!nodeId) return false
  return Boolean(graph.getNodeData(nodeId))
}

export function buildSelectedNodeStatePatch(
  graph: Graph,
  previousNodeId: string | undefined,
  nextNodeId: string | undefined,
): Record<string, string[]> {
  const states: Record<string, string[]> = {}

  if (
    previousNodeId &&
    previousNodeId !== nextNodeId &&
    hasNode(graph, previousNodeId)
  ) {
    states[previousNodeId] = []
  }

  if (nextNodeId && hasNode(graph, nextNodeId)) {
    states[nextNodeId] = ['selected']
  }

  return states
}
