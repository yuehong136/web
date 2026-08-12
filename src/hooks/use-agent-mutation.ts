import { useMutation, useQueryClient } from '@tanstack/react-query'
import { agentAPI } from '@/api/agent'
import { toast } from '@/lib/toast'
import { MutationErrorFeedback } from '@/lib/mutation-error-feedback'
import { adaptAgentFlow, adaptAgentSession } from '@/pages/agent/adapters'
import { agentQueryKeys } from './use-agent-query'
import type {
  DebugAgentNodePayload,
  AgentWebhookTestRequest,
  AgentFlow,
  SetAgentPayload,
} from '@/types/agent'

export interface UploadCanvasFileParams {
  canvasId: string
  file: File | File[]
  onProgress?: (progress: number) => void
  signal?: AbortSignal
}

interface UseSetAgentOptions {
  showToast?: boolean
  errorFeedback?: MutationErrorFeedback
}

export const useSetAgent = (options?: UseSetAgentOptions) => {
  const queryClient = useQueryClient()
  const showToast = options?.showToast ?? true
  const errorFeedback =
    options?.errorFeedback ??
    (showToast ? MutationErrorFeedback.Local : MutationErrorFeedback.Global)

  const mutation = useMutation({
    meta: { errorFeedback },
    mutationFn: async (payload: SetAgentPayload) =>
      adaptAgentFlow(await agentAPI.setAgent(payload)),
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: agentQueryKeys.lists() })
      if (variables.id || data.id) {
        void queryClient.invalidateQueries({
          queryKey: agentQueryKeys.detail(variables.id || data.id),
        })
        void queryClient.invalidateQueries({
          queryKey: agentQueryKeys.versions(variables.id || data.id),
        })
      }
      if (showToast) {
        toast.success('保存成功')
      }
    },
    onError: () => {
      if (showToast) {
        toast.error('保存失败')
      }
    },
  })

  return {
    setAgent: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  }
}

export const useDeleteAgent = () => {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (id: string) => agentAPI.deleteAgent(id),
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: agentQueryKeys.lists() })
      queryClient.removeQueries({ queryKey: agentQueryKeys.detail(id) })
      toast.success('已删除智能体')
    },
    onError: () => {
      toast.error('删除失败')
    },
  })

  return {
    deleteAgent: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  }
}

export const useResetAgent = () => {
  const mutation = useMutation({
    mutationFn: async (id: string) => agentAPI.resetAgent(id),
    onSuccess: () => {
      toast.success('执行状态已重置')
    },
    onError: () => {
      toast.error('重置失败')
    },
  })

  return {
    resetAgent: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  }
}

export const useUpdateAgentSetting = () => {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: agentAPI.updateSetting,
    onSuccess: (_, variables) => {
      queryClient.setQueryData<AgentFlow>(
        agentQueryKeys.detail(variables.id),
        (current) =>
          current
            ? {
                ...current,
                title: variables.title,
                ...(variables.description !== undefined
                  ? { description: variables.description }
                  : {}),
                ...(variables.avatar !== undefined
                  ? { avatar: variables.avatar }
                  : {}),
                ...(variables.permission !== undefined
                  ? { permission: variables.permission }
                  : {}),
              }
            : current,
      )
      void queryClient.invalidateQueries({ queryKey: agentQueryKeys.lists() })
      void queryClient.invalidateQueries({
        queryKey: agentQueryKeys.detail(variables.id),
      })
      toast.success('配置已更新')
    },
    onError: () => {
      toast.error('更新失败')
    },
  })

  return {
    updateAgentSetting: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  }
}

export const useUploadCanvasFile = () => {
  const mutation = useMutation({
    mutationFn: async ({
      canvasId,
      file,
      onProgress,
      signal,
    }: UploadCanvasFileParams) => {
      if (onProgress || signal) {
        if (Array.isArray(file)) {
          throw new Error('批量文件上传暂不支持进度回调')
        }

        return agentAPI.uploadCanvasFileWithProgress(
          canvasId,
          file,
          onProgress,
          signal,
        )
      }

      return agentAPI.uploadFile(canvasId, file)
    },
    onError: () => {
      toast.error('上传失败')
    },
  })

  return {
    uploadCanvasFile: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  }
}

export const useUploadPublicCanvasFile = () => {
  const mutation = useMutation({
    mutationFn: async ({
      canvasId,
      file,
      onProgress,
      signal,
    }: UploadCanvasFileParams) => {
      if (onProgress || signal) {
        if (Array.isArray(file)) {
          throw new Error('批量文件上传暂不支持进度回调')
        }

        return agentAPI.uploadPublicCanvasFileWithProgress(
          canvasId,
          file,
          onProgress,
          signal,
        )
      }

      return agentAPI.uploadPublicFile(canvasId, file)
    },
    onError: () => {
      toast.error('上传失败')
    },
  })

  return {
    uploadCanvasFile: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  }
}

export const useTestWebhook = () => {
  const mutation = useMutation({
    mutationFn: async (payload: AgentWebhookTestRequest) =>
      agentAPI.testWebhook(payload),
    onError: () => {
      toast.error('Webhook 测试失败')
    },
  })

  return {
    testWebhook: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  }
}

export const useDebugSingle = () => {
  const mutation = useMutation({
    mutationFn: async (payload: DebugAgentNodePayload) =>
      agentAPI.debugSingle(payload),
    onError: () => {
      toast.error('调试失败')
    },
  })

  return {
    debugSingle: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  }
}

export const useCancelConversation = () => {
  const mutation = useMutation({
    meta: { errorFeedback: MutationErrorFeedback.Silent },
    mutationFn: async (taskId: string) => agentAPI.cancelTask(taskId),
  })

  return {
    cancelConversation: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  }
}

export const useCancelDataflow = () => {
  const mutation = useMutation({
    meta: { errorFeedback: MutationErrorFeedback.Local },
    mutationFn: async (taskId: string) => agentAPI.cancelDataflow(taskId),
  })

  return {
    cancelDataflow: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  }
}

export const useCreateAgentSession = (canvasId: string) => {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    meta: { errorFeedback: MutationErrorFeedback.Local },
    mutationFn: async (name: string) =>
      adaptAgentSession(await agentAPI.createSession(canvasId, name)),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: agentQueryKeys.sessionsByCanvas(canvasId),
      })
    },
  })

  return {
    createAgentSession: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  }
}

export const useDeleteAgentSession = (canvasId: string) => {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    meta: { errorFeedback: MutationErrorFeedback.Local },
    mutationFn: async (sessionId: string) =>
      agentAPI.deleteSession(canvasId, sessionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: agentQueryKeys.sessionsByCanvas(canvasId),
      })
    },
  })

  return {
    deleteAgentSession: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  }
}
