import useGraphStore from '../store'
import type { RAGFlowNodeType } from '../types'

export function filterChildNodeIds(
  nodes: RAGFlowNodeType[],
  parentId?: string,
): string[] {
  if (!parentId) return []

  return nodes
    .filter((node) => node.parentId === parentId)
    .map((node) => node.id)
}

export function useFilterChildNodeIds(nodeId?: string) {
  const nodes = useGraphStore((state) => state.nodes)

  const childNodeIds = filterChildNodeIds(nodes, nodeId)

  return childNodeIds ?? []
}
