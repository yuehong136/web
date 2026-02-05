import { getOutgoers, type Connection, type Edge } from '@xyflow/react'
import { useCallback } from 'react'
import { Operator, RestrictedUpstreamMap } from '../constant'
import type { RAGFlowNodeType } from '../types'
import useGraphStore from '../store'

export const useValidateConnection = () => {
  const { getOperatorTypeFromId, getParentIdById, edges, nodes } =
    useGraphStore((state) => state)

  const isSameNodeChild = useCallback(
    (connection: Connection | Edge) => {
      const sourceParentId = getParentIdById(connection.source)
      const targetParentId = getParentIdById(connection.target)
      if (sourceParentId || targetParentId) {
        return sourceParentId === targetParentId
      }
      return true
    },
    [getParentIdById],
  )

  const hasCanvasCycle = useCallback(
    (connection: Connection | Edge) => {
      const target = nodes.find((node) => node.id === connection.target)
      const hasCycle = (node: RAGFlowNodeType, visited = new Set<string>()) => {
        if (visited.has(node.id)) return false

        visited.add(node.id)

        for (const outgoer of getOutgoers(node, nodes, edges)) {
          if (outgoer.id === connection.source) return true
          if (hasCycle(outgoer, visited)) return true
        }
        return false
      }

      if (target?.id === connection.source) return false

      return target ? !hasCycle(target) : false
    },
    [edges, nodes],
  )

  const isValidConnection = useCallback(
    (connection: Connection | Edge) => {
      const isSelfConnected = connection.target === connection.source

      const ret =
        !isSelfConnected &&
        RestrictedUpstreamMap[
          getOperatorTypeFromId(connection.source) as Operator
        ]?.every((x) => x !== getOperatorTypeFromId(connection.target)) &&
        isSameNodeChild(connection) &&
        hasCanvasCycle(connection)
      return ret
    },
    [getOperatorTypeFromId, hasCanvasCycle, isSameNodeChild],
  )

  return isValidConnection
}

