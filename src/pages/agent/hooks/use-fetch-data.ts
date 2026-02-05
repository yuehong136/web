import { useEffect } from 'react'
import { useFetchAgent as useFetchAgentQuery } from '@/hooks/use-agent-query'
import { useSetGraphInfo } from './use-set-graph'
import type { IFlow, IGraph } from '../types'

// 获取Canvas详情的Hook
export const useFetchAgent = () => {
  const { agent, isLoading, refetch } = useFetchAgentQuery()
  return { data: (agent || ({} as IFlow)) as IFlow, loading: isLoading, refetch }
}

// 页面挂载时获取数据并初始化画布 - 完全照抄RAGFlow
export const useFetchDataOnMount = () => {
  const { data, loading, refetch } = useFetchAgent()
  const setGraphInfo = useSetGraphInfo()

  // 当数据加载完成后，初始化画布 - 完全照抄RAGFlow的逻辑
  useEffect(() => {
    // 照抄RAGFlow：调用setGraphInfo，如果没有graph就传空对象
    const graph = data?.dsl?.graph ?? ({} as IGraph)
    setGraphInfo(graph)
  }, [setGraphInfo, data])

  // 组件挂载时触发数据获取 - 照抄RAGFlow
  useEffect(() => {
    refetch()
  }, [refetch])

  return { loading, flowDetail: data }
}
