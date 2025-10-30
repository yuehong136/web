import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { agentAPI } from '@/api/agent'
import { QUERY_KEYS } from '@/constants'
import { useSetGraphInfo } from './use-set-graph'
import type { IFlow, IGraph } from '../types'

// 获取Canvas详情的Hook
export const useFetchAgent = () => {
  const { id } = useParams<{ id: string }>()

  const {
    data,
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: [QUERY_KEYS.AGENT_DETAIL, id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return {} as IFlow
      
      console.log('🔍 [useFetchAgent] 开始获取Canvas详情, ID:', id)
      const result = await agentAPI.fetchAgent(id)
      console.log('📦 [useFetchAgent] Canvas详情原始返回:', result)
      console.log('📦 [useFetchAgent] result是数组吗?', Array.isArray(result))
      
      // 处理后端返回的数组格式: [true, { id, dsl, ... }]
      let canvasData = result
      if (Array.isArray(result)) {
        console.log('🔄 [useFetchAgent] 检测到数组格式，提取第二个元素')
        canvasData = result[1] || result[0] || {}
        console.log('📦 [useFetchAgent] 提取后的数据:', canvasData)
      }
      
      console.log('📦 [useFetchAgent] DSL类型:', typeof canvasData?.dsl)
      
      // 处理dsl可能是字符串的情况
      if (canvasData && typeof canvasData.dsl === 'string') {
        console.log('🔄 [useFetchAgent] DSL是字符串，需要parse')
        try {
          canvasData.dsl = JSON.parse(canvasData.dsl)
          console.log('✅ [useFetchAgent] DSL parse成功')
        } catch (e) {
          console.error('❌ [useFetchAgent] DSL parse失败:', e)
        }
      }
      
      console.log('📦 [useFetchAgent] 最终DSL:', canvasData?.dsl)
      console.log('📦 [useFetchAgent] DSL.graph:', canvasData?.dsl?.graph)
      console.log('📦 [useFetchAgent] DSL.graph.nodes数量:', canvasData?.dsl?.graph?.nodes?.length)
      
      return canvasData as IFlow
    },
  })

  return { data: data || {} as IFlow, loading, refetch }
}

// 页面挂载时获取数据并初始化画布 - 完全照抄RAGFlow
export const useFetchDataOnMount = () => {
  const { data, loading, refetch } = useFetchAgent()
  const setGraphInfo = useSetGraphInfo()

  // 当数据加载完成后，初始化画布 - 完全照抄RAGFlow的逻辑
  useEffect(() => {
    console.log('🎨 [useFetchDataOnMount] useEffect触发')
    console.log('📊 [useFetchDataOnMount] data:', data)
    console.log('📊 [useFetchDataOnMount] data.dsl:', data?.dsl)
    console.log('📊 [useFetchDataOnMount] data.dsl.graph:', data?.dsl?.graph)
    
    // 照抄RAGFlow：调用setGraphInfo，如果没有graph就传空对象
    const graph = data?.dsl?.graph ?? ({} as IGraph)
    console.log('🔧 [useFetchDataOnMount] 准备设置graph:', graph)
    setGraphInfo(graph)
  }, [setGraphInfo, data])

  // 组件挂载时触发数据获取 - 照抄RAGFlow
  useEffect(() => {
    console.log('🚀 [useFetchDataOnMount] 组件挂载，触发refetch')
    refetch()
  }, [refetch])

  return { loading, flowDetail: data }
}

