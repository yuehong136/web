import { useCallback, useState } from 'react'
import { agentAPI } from '@/api/agent'
import { useBuildDslData } from './use-build-dsl'
import type { RAGFlowNodeType } from '../types'
import { toast } from '@/lib/toast'

export const useSaveGraph = (agentId?: string, showMessage: boolean = true) => {
  const [loading, setLoading] = useState(false)
  const { buildDslData } = useBuildDslData()

  const saveGraph = useCallback(
    async (title: string, currentNodes?: RAGFlowNodeType[]) => {
      if (!agentId) {
        console.warn('⚠️ [useSaveGraph] agentId缺失，无法保存')
        if (showMessage) {
          toast.error('Agent ID is required')
        }
        return null
      }

      try {
        setLoading(true)
        console.log('💾 [useSaveGraph] 开始保存, ID:', agentId)
        
        const dsl = buildDslData(currentNodes)
        console.log('📦 [useSaveGraph] DSL构建完成:', dsl)
        
        const result = await agentAPI.setAgent({
          id: agentId,
          title,
          dsl,
        })
        
        console.log('✅ [useSaveGraph] 保存成功:', result)
        
        if (showMessage) {
          toast.success('保存成功')
        }
        
        return result
      } catch (error) {
        console.error('❌ [useSaveGraph] 保存失败:', error)
        if (showMessage) {
          toast.error('保存失败')
        }
        return null
      } finally {
        setLoading(false)
      }
    },
    [agentId, buildDslData, showMessage],
  )

  return { saveGraph, loading }
}


