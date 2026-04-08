import { useCallback } from 'react'
import { useFetchAgent as useFetchAgentQuery } from '@/hooks/use-agent-query'
import type { RAGFlowNodeType } from '../types'
import useGraphStore from '../store'
import { serializeGraphToDsl } from '../operators'

export const useBuildDslData = () => {
  const { nodes, edges } = useGraphStore((state) => state)
  const { data: agent } = useFetchAgentQuery()

  const buildDslData = useCallback(
    (currentNodes?: RAGFlowNodeType[]) => {
      return serializeGraphToDsl({
        graph: {
          nodes: currentNodes ?? nodes,
          edges,
        },
        baseDsl: agent?.dsl,
      })
    },
    [agent?.dsl, edges, nodes],
  )

  return { buildDslData }
}
