import { useCallback } from 'react'
import useGraphStore from '../store'
import type { IGraph } from '../types'

// 照抄RAGFlow的useSetGraphInfo
export const useSetGraphInfo = () => {
  const { setEdges, setNodes } = useGraphStore((state) => state)
  
  const setGraphInfo = useCallback(
    ({ nodes = [], edges = [] }: IGraph) => {
      console.log('🔧 [useSetGraphInfo] 准备设置画布数据')
      console.log('   - nodes数量:', nodes.length)
      console.log('   - edges数量:', edges.length)
      
      // 确保所有edges都有type字段（照抄RAGFlow）
      const processedEdges = edges.map(edge => ({
        ...edge,
        type: edge.type || 'buttonEdge', // 如果没有type，默认使用buttonEdge
      }))
      
      console.log('🔧 [useSetGraphInfo] 处理后的edges:', processedEdges)
      
      // RAGFlow的逻辑：只有当有节点或边时才设置
      if (nodes.length || processedEdges.length) {
        console.log('✅ [useSetGraphInfo] 条件满足，开始设置')
        setNodes(nodes)
        setEdges(processedEdges)
        
        // 验证store是否真的更新了
        setTimeout(() => {
          const currentNodes = useGraphStore.getState().nodes
          const currentEdges = useGraphStore.getState().edges
          console.log('🔍 [useSetGraphInfo] Store验证 - nodes数量:', currentNodes.length)
          console.log('🔍 [useSetGraphInfo] Store验证 - edges数量:', currentEdges.length)
        }, 100)
      } else {
        console.warn('⚠️ [useSetGraphInfo] nodes和edges都为空，跳过设置')
      }
    },
    [setEdges, setNodes],
  )
  
  return setGraphInfo
}

