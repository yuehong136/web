import { useCallback, useEffect, useState } from 'react'
import useGraphStore from '../store'
import { useSaveGraph } from './use-save-graph'
import { useParams } from 'react-router-dom'
import { useFetchAgent } from './use-fetch-data'
import { formatRelativeTime } from '@/lib/utils'

// 格式化时间显示
const formatDate = (timestamp: number) => {
  return formatRelativeTime(timestamp)
}

// 监听画布变化并自动保存
export const useWatchAgentChange = () => {
  const { id } = useParams<{ id: string }>()
  const [time, setTime] = useState<string>()
  const nodes = useGraphStore((state) => state.nodes)
  const edges = useGraphStore((state) => state.edges)
  const { saveGraph } = useSaveGraph(id, false) // 不显示toast
  const { data: flowDetail } = useFetchAgent()

  // 保存后更新时间显示
  const setSaveTime = useCallback((updateTime: number) => {
    setTime(formatDate(updateTime))
  }, [])

  // 初始化时设置时间
  useEffect(() => {
    if (flowDetail?.update_time) {
      setSaveTime(flowDetail.update_time)
    }
  }, [flowDetail, setSaveTime])

  // 监听节点和边的变化，防抖保存
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!id || !flowDetail?.title) return

      console.log('🔄 [自动保存] 20秒后触发自动保存')

      try {
        // 获取title
        const titleText =
          typeof flowDetail.title === 'object'
            ? flowDetail.title.zh || flowDetail.title.en || 'Untitled'
            : flowDetail.title || 'Untitled'

        const ret = await saveGraph(titleText)
        if (ret?.update_time) {
          setSaveTime(ret.update_time)
        }
        console.log('✅ [自动保存] 保存成功')
      } catch (error) {
        console.error('❌ [自动保存] 保存失败:', error)
      }
    }, 20000) // 20秒防抖

    return () => clearTimeout(timer)
  }, [nodes, edges, id, flowDetail, saveGraph, setSaveTime])

  return time
}
