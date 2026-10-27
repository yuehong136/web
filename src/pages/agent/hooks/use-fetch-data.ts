import { useEffect, useRef } from 'react'
import isEqual from 'lodash/isEqual'
import useGraphStore from '@/pages/agent/store'
import { useFetchAgent as useFetchAgentQuery } from '@/hooks/use-agent-query'
import { isPipelineFlow } from '@/lib/agent'
import { AgentCanvasType } from '@/types/agent'
import { useSetGraphInfo } from './use-set-graph'
import { deserializeDslToGraph } from '../operators'
import type { IFlow } from '../types'

// 获取Canvas详情的Hook
export const useFetchAgent = () => {
  const { agent, isLoading, refetch } = useFetchAgentQuery()
  return { data: agent as IFlow | undefined, loading: isLoading, refetch }
}

export const useFetchDataOnMount = () => {
  const { data, loading } = useFetchAgent()
  const setGraphInfo = useSetGraphInfo()
  const hydrated = useRef<{
    id: string
    nodes: unknown
    edges: unknown
  } | null>(null)

  useEffect(() => {
    if (!data?.id || !data?.dsl) {
      return
    }

    const current = useGraphStore.getState()
    const previous = hydrated.current
    // A save invalidates detail while the editor may already contain a newer draft.
    if (
      previous?.id === data.id &&
      (!isEqual(current.nodes, previous.nodes) ||
        !isEqual(current.edges, previous.edges))
    )
      return

    setGraphInfo(
      deserializeDslToGraph(data.dsl, {
        canvasType: isPipelineFlow(data)
          ? AgentCanvasType.PIPELINE
          : AgentCanvasType.AGENT,
      }).graph,
    )
    const graph = useGraphStore.getState()
    hydrated.current = { id: data.id, nodes: graph.nodes, edges: graph.edges }
  }, [setGraphInfo, data])

  return { loading, flowDetail: data }
}
