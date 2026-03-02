/**
 * 生成模块状态管理 Hook
 *
 * 集中管理 GraphRAG 与 RAPTOR 的追踪、启动、暂停、删除操作，
 * 供 GenerateButton / TaskDock / DeleteConfirm 共享。
 */

import { useState, useCallback } from 'react'
import { toast } from '@/lib/toast'
import {
  GenerateTaskType,
  useTraceKnowledgeTask,
  useRunKnowledgeTask,
  usePauseKnowledgeTask,
  useUnbindKnowledgeTask,
} from '@/hooks/use-generate-task'
import { TASK_TYPE_CONFIG } from './constants'

export function useGenerateState(kbId: string) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingType, setDeletingType] = useState<GenerateTaskType | null>(null)

  const graph = useTraceKnowledgeTask({
    kbId,
    type: GenerateTaskType.GraphRAG,
    enabled: !!kbId,
  })
  const raptor = useTraceKnowledgeTask({
    kbId,
    type: GenerateTaskType.Raptor,
    enabled: !!kbId,
  })

  const { runTask, isRunning: isRunPending } = useRunKnowledgeTask()
  const { pauseTask, isPausing } = usePauseKnowledgeTask()
  const { unbindTask, isUnbinding } = useUnbindKnowledgeTask()

  const isActionPending = isRunPending || isPausing || isUnbinding

  const handleRun = useCallback(
    async (type: GenerateTaskType) => {
      try {
        await runTask({ kbId, type })
        toast.success(`${TASK_TYPE_CONFIG[type].label} 任务已启动`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : `启动 ${TASK_TYPE_CONFIG[type].label} 失败`
        toast.error(msg)
      }
    },
    [kbId, runTask]
  )

  const handlePause = useCallback(
    async (taskId: string, type: GenerateTaskType) => {
      try {
        await pauseTask({ taskId, kbId, type })
        toast.success(`${TASK_TYPE_CONFIG[type].label} 任务已暂停`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : `暂停 ${TASK_TYPE_CONFIG[type].label} 失败`
        toast.error(msg)
      }
    },
    [kbId, pauseTask]
  )

  const handleDeleteRequest = useCallback((type: GenerateTaskType) => {
    setDeletingType(type)
    setDeleteConfirmOpen(true)
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingType) return
    try {
      await unbindTask({ kbId, type: deletingType })
      toast.success(`${TASK_TYPE_CONFIG[deletingType].label} 生成结果已删除`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '删除失败'
      toast.error(msg)
    } finally {
      setDeleteConfirmOpen(false)
      setDeletingType(null)
    }
  }, [kbId, deletingType, unbindTask])

  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirmOpen(false)
    setDeletingType(null)
  }, [])

  return {
    graph,
    raptor,
    isActionPending,
    handleRun,
    handlePause,
    handleDeleteRequest,
    deleteConfirmOpen,
    deletingType,
    handleDeleteConfirm,
    handleDeleteCancel,
  }
}
