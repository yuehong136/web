import { useCallback } from 'react'
import isEqual from 'lodash/isEqual'
import useGraphStore from '../store'
import type { IGraph } from '../types'

export const useSetGraphInfo = () => {
  const { setEdges, setNodes } = useGraphStore((state) => state)

  const setGraphInfo = useCallback(
    ({ nodes = [], edges = [] }: IGraph) => {
      const processedEdges = edges.map((edge) => ({
        ...edge,
        type: edge.type || 'buttonEdge',
      }))

      const currentState = useGraphStore.getState()
      const currentNodes = currentState.nodes
      const currentEdges = currentState.edges

      if (
        isEqual(currentNodes, nodes) &&
        isEqual(currentEdges, processedEdges)
      ) {
        return
      }

      setNodes(nodes)
      setEdges(processedEdges)
    },
    [setEdges, setNodes],
  )

  return setGraphInfo
}
