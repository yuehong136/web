import { useEffect } from 'react'
import { useFetchAgent as useFetchAgentQuery } from '@/hooks/use-agent-query'
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

  useEffect(() => {
    if (!data?.id || !data?.dsl) {
      return
    }

    setGraphInfo(
      deserializeDslToGraph(data.dsl, {
        canvasType:
          data.canvas_type === 'pipeline'
            ? AgentCanvasType.PIPELINE
            : AgentCanvasType.AGENT,
      }).graph,
    )
  }, [setGraphInfo, data])

  return { loading, flowDetail: data }
}
