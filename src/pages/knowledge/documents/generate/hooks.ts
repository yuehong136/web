/**
 * 生成模块状态管理 Hook
 *
 * 集中管理 GraphRAG 与 RAPTOR 的追踪、启动、暂停、删除操作，
 * 供 GenerateButton / TaskDock / DeleteConfirm 共享。
 */

import { useState, useCallback, useLayoutEffect, useRef } from 'react'
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

  const feedbackScope = useRef({
    kbId,
    generations: new Map<GenerateTaskType, object>(),
  })
  const mounted = useRef(true)
  const pendingPauses = useRef(new Set<string>())
  useLayoutEffect(() => {
    feedbackScope.current = { kbId, generations: new Map() }
    return () => {
      feedbackScope.current = { kbId: '', generations: new Map() }
    }
  }, [kbId])
  useLayoutEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  const captureFeedback = useCallback(
    (type: GenerateTaskType, newRun = false) => {
      const scope = feedbackScope.current
      if (newRun || !scope.generations.has(type))
        scope.generations.set(type, {})
      const generation = scope.generations.get(type)
      return () =>
        mounted.current &&
        feedbackScope.current === scope &&
        scope.generations.get(type) === generation
    },
    [],
  )

  useLayoutEffect(() => {
    feedbackScope.current.generations.set(GenerateTaskType.GraphRAG, {})
  }, [graph.traceData?.id])
  useLayoutEffect(() => {
    feedbackScope.current.generations.set(GenerateTaskType.Raptor, {})
  }, [raptor.traceData?.id])

  const handleRun = useCallback(
    async (type: GenerateTaskType) => {
      const ownsFeedback = captureFeedback(type, true)
      try {
        await runTask({ kbId, type })
        if (!ownsFeedback()) return
        toast.success(
          t('knowledge.documents.generate.runSuccess', {
            label: t(TASK_TYPE_CONFIG[type].labelKey),
          }),
        )
      } catch {
        if (!ownsFeedback()) return
        toast.error(
          t('knowledge.documents.generate.runError', {
            label: t(TASK_TYPE_CONFIG[type].labelKey),
          }),
        )
      }
    },
    [captureFeedback, kbId, runTask, t],
  )

  const handlePause = useCallback(
    async (taskId: string, type: GenerateTaskType) => {
      if (!taskId || pendingPauses.current.has(taskId)) return
      const ownsFeedback = captureFeedback(type)
      pendingPauses.current.add(taskId)
      try {
        await pauseTask({ taskId, kbId, type })
        if (!ownsFeedback()) return
        toast.success(
          t('knowledge.documents.generate.pauseSuccess', {
            label: t(TASK_TYPE_CONFIG[type].labelKey),
          }),
        )
      } catch {
        if (!ownsFeedback()) return
        toast.error(
          t('knowledge.documents.generate.pauseError', {
            label: t(TASK_TYPE_CONFIG[type].labelKey),
          }),
        )
      } finally {
        pendingPauses.current.delete(taskId)
      }
    },
    [captureFeedback, kbId, pauseTask, t],
  )

  const handleDeleteRequest = useCallback((type: GenerateTaskType) => {
    setDeletingType(type)
    setDeleteConfirmOpen(true)
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingType || isUnbinding) return
    try {
      await unbindTask({ kbId, type: deletingType })
      toast.success(
        t('knowledge.documents.generate.deleteSuccess', {
          label: t(TASK_TYPE_CONFIG[deletingType].labelKey),
        }),
      )
      setDeleteConfirmOpen(false)
      setDeletingType(null)
    } catch {
      toast.error(t('knowledge.documents.generate.deleteError'))
    }
  }, [kbId, deletingType, isUnbinding, unbindTask, t])

  const handleDeleteCancel = useCallback(() => {
    if (isUnbinding) return
    setDeleteConfirmOpen(false)
    setDeletingType(null)
  }, [isUnbinding])

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
