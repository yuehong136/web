import { useCallback } from 'react'
import useGraphStore from '../store'

/**
 * Hook for changing node name
 */
export const useChangeNodeName = () => {
  const { updateNodeName, getNode, nodes } = useGraphStore((state) => state)

  const changeNodeName = useCallback(
    (nodeId: string, newName: string) => {
      const node = getNode(nodeId)
      if (!node) return false

      // Check if name is already taken
      const nameExists = nodes.some(
        (n) => n.id !== nodeId && n.data.name === newName,
      )

      if (nameExists) {
        return false
      }

      updateNodeName(nodeId, newName)
      return true
    },
    [getNode, nodes, updateNodeName],
  )

  const validateNodeName = useCallback(
    (nodeId: string, name: string) => {
      if (!name.trim()) {
        return { valid: false, error: 'Name cannot be empty' }
      }

      const nameExists = nodes.some(
        (n) => n.id !== nodeId && n.data.name === name,
      )

      if (nameExists) {
        return { valid: false, error: 'Name already exists' }
      }

      return { valid: true, error: null }
    },
    [nodes],
  )

  return {
    changeNodeName,
    validateNodeName,
  }
}
