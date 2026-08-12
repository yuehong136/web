/**
 * 生成模块状态管理 Hook
 *
 * 集中管理 GraphRAG 与 RAPTOR 的追踪、启动、暂停、删除操作，
 * 供 GenerateButton / TaskDock / DeleteConfirm 共享。
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingType, setDeletingType] = useState<GenerateTaskType | null>(
    null,
  )

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
        toast.success(
          t('knowledge.documents.generate.runSuccess', {
            label: t(TASK_TYPE_CONFIG[type].labelKey),
          }),
        )
      } catch {
        toast.error(
          t('knowledge.documents.generate.runError', {
            label: t(TASK_TYPE_CONFIG[type].labelKey),
          }),
        )
      }
    },
    [kbId, runTask, t],
  )

  const handlePause = useCallback(
    async (taskId: string, type: GenerateTaskType) => {
      try {
        await pauseTask({ taskId, kbId, type })
        toast.success(
          t('knowledge.documents.generate.pauseSuccess', {
            label: t(TASK_TYPE_CONFIG[type].labelKey),
          }),
        )
      } catch {
        toast.error(
          t('knowledge.documents.generate.pauseError', {
            label: t(TASK_TYPE_CONFIG[type].labelKey),
          }),
        )
      }
    },
    [kbId, pauseTask, t],
  )

  const handleDeleteRequest = useCallback((type: GenerateTaskType) => {
    setDeletingType(type)
    setDeleteConfirmOpen(true)
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingType) return
    try {
      await unbindTask({ kbId, type: deletingType })
      toast.success(
        t('knowledge.documents.generate.deleteSuccess', {
          label: t(TASK_TYPE_CONFIG[deletingType].labelKey),
        }),
      )
    } catch {
      toast.error(t('knowledge.documents.generate.deleteError'))
    } finally {
      setDeleteConfirmOpen(false)
      setDeletingType(null)
    }
  }, [kbId, deletingType, unbindTask, t])

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
