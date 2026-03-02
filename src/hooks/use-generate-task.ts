/**
 * Generate Task Hooks (GraphRAG / RAPTOR)
 *
 * 统一管理知识库生成任务的启动、追踪、暂停和解绑。
 * 轮询策略：progress 在 [0,1) 时每 5s 刷新；完成/失败/空数据时停止。
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { knowledgeAPI } from '@/api/knowledge'
import { agentAPI } from '@/api/agent'
import { knowledgeKeys } from './use-knowledge-request'

// ============================================================================
// 类型定义
// ============================================================================

export enum GenerateTaskType {
  GraphRAG = 'GraphRAG',
  Raptor = 'RAPTOR',
}

export enum GenerateTaskStatus {
  Start = 'start',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
}

export interface TraceInfo {
  id: string
  progress: number
  progress_msg: string
  begin_at: string
  create_date: string
  update_date: string
  process_duration: number
  task_type: string
}

// ============================================================================
// Query Keys
// ============================================================================

export const generateKeys = {
  all: ['generate'] as const,
  trace: (kbId: string, type: GenerateTaskType) =>
    [...generateKeys.all, 'trace', kbId, type] as const,
}

// ============================================================================
// 状态推导
// ============================================================================

export function deriveTaskStatus(data: TraceInfo | null | undefined): GenerateTaskStatus {
  if (!data || !('progress' in data) || data.progress === undefined || data.progress === null) {
    return GenerateTaskStatus.Start
  }
  if (data.progress >= 1) return GenerateTaskStatus.Completed
  if (data.progress < 0) return GenerateTaskStatus.Failed
  return GenerateTaskStatus.Running
}

function isRunning(data: TraceInfo | null | undefined): boolean {
  return deriveTaskStatus(data) === GenerateTaskStatus.Running
}

// ============================================================================
// Hooks
// ============================================================================

const POLLING_INTERVAL = 5000

/**
 * 追踪某个生成任务的实时进度
 */
export function useTraceKnowledgeTask(params: {
  kbId: string
  type: GenerateTaskType
  enabled?: boolean
}) {
  const { kbId, type, enabled = true } = params

  const { data, isFetching, isError, error, refetch } = useQuery<TraceInfo | Record<string, never>>({
    queryKey: generateKeys.trace(kbId, type),
    queryFn: async () => {
      const fn =
        type === GenerateTaskType.GraphRAG
          ? knowledgeAPI.generate.traceGraphRag
          : knowledgeAPI.generate.traceRaptor
      return fn(kbId)
    },
    enabled: !!kbId && enabled,
    gcTime: 0,
    retry: 3,
    retryDelay: 1000,
    refetchInterval: (query) => {
      const d = query.state.data as TraceInfo | undefined
      return isRunning(d as TraceInfo | null | undefined) ? POLLING_INTERVAL : false
    },
    placeholderData: (prev) => prev,
  })

  const traceData = (data && 'id' in data ? data : null) as TraceInfo | null
  const status = deriveTaskStatus(traceData)

  return { traceData, status, isFetching, isError, error, refetch }
}

/**
 * 启动 GraphRAG 或 RAPTOR 生成
 */
export function useRunKnowledgeTask() {
  const queryClient = useQueryClient()

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (params: { kbId: string; type: GenerateTaskType }) => {
      const fn =
        params.type === GenerateTaskType.GraphRAG
          ? knowledgeAPI.generate.runGraphRag
          : knowledgeAPI.generate.runRaptor
      return fn({ kb_id: params.kbId })
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: generateKeys.trace(variables.kbId, variables.type),
      })
      queryClient.invalidateQueries({
        queryKey: knowledgeKeys.detail(variables.kbId),
      })
    },
  })

  return { runTask: mutateAsync, isRunning: isPending }
}

/**
 * 暂停生成任务（cancelDataflow + unbindPipelineTask）
 */
export function usePauseKnowledgeTask() {
  const queryClient = useQueryClient()

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (params: {
      taskId: string
      kbId: string
      type: GenerateTaskType
    }) => {
      await agentAPI.cancelDataflow(params.taskId)
      await knowledgeAPI.generate.unbindPipelineTask({
        kb_id: params.kbId,
        pipeline_task_type: params.type,
      })
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: generateKeys.trace(variables.kbId, variables.type),
      })
      queryClient.invalidateQueries({
        queryKey: knowledgeKeys.detail(variables.kbId),
      })
    },
  })

  return { pauseTask: mutateAsync, isPausing: isPending }
}

/**
 * 删除生成结果（unbindPipelineTask）
 */
export function useUnbindKnowledgeTask() {
  const queryClient = useQueryClient()

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (params: { kbId: string; type: GenerateTaskType }) => {
      return knowledgeAPI.generate.unbindPipelineTask({
        kb_id: params.kbId,
        pipeline_task_type: params.type,
      })
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: generateKeys.trace(variables.kbId, variables.type),
      })
      queryClient.invalidateQueries({
        queryKey: knowledgeKeys.detail(variables.kbId),
      })
    },
  })

  return { unbindTask: mutateAsync, isUnbinding: isPending }
}
