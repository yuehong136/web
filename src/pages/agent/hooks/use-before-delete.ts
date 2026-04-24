import { useCallback } from 'react'
import type { Node, Edge } from '@xyflow/react'
import { Operator } from '../constant'
import useGraphStore from '../store'

/**
 * Hook for pre-delete validation
 * Prevents deletion of required nodes and handles cascade deletions
 */
export const useBeforeDelete = () => {
  const {
    deleteAgentDownstreamNodesById,
    deleteAgentToolNodeById,
    deleteIterationNodeById,
    getOperatorTypeFromId,
  } = useGraphStore((state) => state)

  const handleBeforeDelete = useCallback(
    async (params: { nodes: Node[]; edges: Edge[] }) => {
      const { nodes } = params

      // Check for protected nodes (Begin node)
      const hasProtectedNode = nodes.some((node) => {
        const operatorType = getOperatorTypeFromId(node.id)
        return operatorType === Operator.Begin
      })

      if (hasProtectedNode) {
        // Prevent deletion of Begin node
        return false
      }

      // Handle cascade deletions for special node types
      for (const node of nodes) {
        const operatorType = getOperatorTypeFromId(node.id)

        if (operatorType === Operator.Agent) {
          // Delete downstream tool nodes
          deleteAgentDownstreamNodesById(node.id)
          deleteAgentToolNodeById(node.id)
        }

        if (operatorType === Operator.Iteration || operatorType === Operator.Loop) {
          // Delete iteration/loop node and its children
          deleteIterationNodeById(node.id)
        }
      }

      return true
    },
    [
      deleteAgentDownstreamNodesById,
      deleteAgentToolNodeById,
      deleteIterationNodeById,
      getOperatorTypeFromId,
    ],
  )

  return { handleBeforeDelete }
}
