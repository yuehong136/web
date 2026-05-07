import { useCallback } from 'react'
import { useFetchAgent as useFetchAgentQuery } from '@/hooks/use-agent-query'
import type { AgentGlobalVariable } from '@/types/agent'
import type { RAGFlowNodeType } from '../types'
import useGraphStore from '../store'
import { serializeGraphToDsl } from '../operators'

export type BuildDslDataOptions = {
  globalVariables?: Record<string, AgentGlobalVariable>
}

export const useBuildDslData = () => {
  const { nodes, edges } = useGraphStore((state) => state)
  const { data: agent } = useFetchAgentQuery()

  const buildDslData = useCallback(
    (currentNodes?: RAGFlowNodeType[], options?: BuildDslDataOptions) => {
      return serializeGraphToDsl({
        graph: {
          nodes: currentNodes ?? nodes,
          edges,
        },
        baseDsl: agent?.dsl,
        globalVariables: options?.globalVariables,
      })
    },
    [agent?.dsl, edges, nodes],
  )

  return { buildDslData }
}
